from __future__ import annotations

import json
from typing import Dict, List, Tuple

import numpy as np
from app.services.workspace import get_project_images_dir, get_project_workspace


MODEL_ID = "openai/clip-vit-base-patch32"

_clip_model = None
_clip_processor = None

def _load_clip_components():
    global _clip_model, _clip_processor

    if _clip_model is None or _clip_processor is None:
        import torch
        from transformers import CLIPModel, CLIPProcessor

        _clip_processor = CLIPProcessor.from_pretrained(MODEL_ID)
        _clip_model = CLIPModel.from_pretrained(MODEL_ID)
        _clip_model.eval()
        _clip_model.to(torch.device("cpu"))

    return _clip_model, _clip_processor


def _load_project_images(project_id: str) -> List[Dict[str, str]]:
    workspace_dir = get_project_workspace(project_id)
    if not workspace_dir.exists():
        raise FileNotFoundError(f"Project workspace '{project_id}' was not found.")

    annotations_path = workspace_dir / "annotations.json"
    if not annotations_path.exists():
        raise ValueError("Project annotations.json is missing from the backend workspace.")

    images_dir = get_project_images_dir(project_id)
    if not images_dir.exists():
        raise ValueError("Project images directory is missing from the backend workspace.")

    with annotations_path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    images_metadata = payload.get("imagesMetadata")
    if not isinstance(images_metadata, list) or len(images_metadata) == 0:
        raise ValueError("Project annotations do not contain a valid imagesMetadata array.")

    image_entries: List[Dict[str, str]] = []
    seen_image_ids = set()

    for item in images_metadata:
        if not isinstance(item, dict):
            raise ValueError("imagesMetadata contains an invalid item.")

        image_id = item.get("id")
        file_name = item.get("fileName")

        if not isinstance(image_id, str) or not image_id.strip():
            raise ValueError("imagesMetadata contains an image without a valid id.")
        if not isinstance(file_name, str) or not file_name.strip():
            raise ValueError("imagesMetadata contains an image without a valid fileName.")
        if image_id in seen_image_ids:
            raise ValueError(f"Duplicate image id detected in annotations: '{image_id}'.")

        image_path = images_dir / image_id / file_name
        legacy_image_path = images_dir / file_name

        if image_path.exists():
            resolved_path = image_path
        elif legacy_image_path.exists():
            resolved_path = legacy_image_path
        else:
            raise ValueError(f"Image file '{file_name}' is missing from the backend workspace.")

        image_entries.append({
            "id": image_id,
            "file_name": file_name,
            "path": str(resolved_path)
        })
        seen_image_ids.add(image_id)

    return image_entries


def _compute_normalized_embedding(image_path: str) -> np.ndarray:
    import torch
    from PIL import Image

    model, processor = _load_clip_components()

    with Image.open(image_path) as image:
        rgb_image = image.convert("RGB")
        inputs = processor(images=rgb_image, return_tensors="pt")

    with torch.inference_mode():
        features = model.get_image_features(**inputs)

        # `transformers` 5.x returns a BaseModelOutputWithPooling here, while
        # older versions returned the projected tensor directly.
        if hasattr(features, "pooler_output"):
            features = features.pooler_output
        elif isinstance(features, tuple):
            if len(features) < 2:
                raise TypeError("CLIP image feature tuple output is missing pooled embeddings.")
            features = features[1]

        if not hasattr(features, "norm"):
            raise TypeError(
                f"Unsupported CLIP image feature output type: {type(features).__name__}"
            )

        features = features / features.norm(p=2, dim=-1, keepdim=True)

    return features[0].cpu().numpy().astype(np.float32)


def _compute_similarity_matrix(embeddings: List[np.ndarray]) -> np.ndarray:
    stacked = np.stack(embeddings, axis=0)
    return np.matmul(stacked, stacked.T)


def _find_seed_pair(similarity_matrix: np.ndarray) -> Tuple[int, int]:
    total_images = similarity_matrix.shape[0]
    best_pair = (0, 1)
    best_score = similarity_matrix[0, 1]

    for left_index in range(total_images):
        for right_index in range(left_index + 1, total_images):
            score = similarity_matrix[left_index, right_index]
            if score > best_score:
                best_score = score
                best_pair = (left_index, right_index)

    return best_pair


def _build_similarity_order(similarity_matrix: np.ndarray) -> List[int]:
    total_images = similarity_matrix.shape[0]
    if total_images == 0:
        return []
    if total_images == 1:
        return [0]

    first_index, second_index = _find_seed_pair(similarity_matrix)
    ordered_indices = [first_index, second_index]
    remaining_indices = [index for index in range(total_images) if index not in ordered_indices]

    while remaining_indices:
        anchor_index = ordered_indices[-1]
        next_index = max(
            remaining_indices,
            key=lambda candidate_index: (
                float(similarity_matrix[anchor_index, candidate_index]),
                -candidate_index
            )
        )
        ordered_indices.append(next_index)
        remaining_indices.remove(next_index)

    return ordered_indices


def order_project_images(project_id: str) -> Dict[str, object]:
    image_entries = _load_project_images(project_id)

    if len(image_entries) < 2:
        raise ValueError("At least two synchronized images are required to compute similarity ordering.")

    embeddings = [_compute_normalized_embedding(entry["path"]) for entry in image_entries]
    similarity_matrix = _compute_similarity_matrix(embeddings)
    ordered_indices = _build_similarity_order(similarity_matrix)

    ordered_entries = [image_entries[index] for index in ordered_indices]
    adjacent_scores = []

    for current_index in range(len(ordered_indices) - 1):
        left_index = ordered_indices[current_index]
        right_index = ordered_indices[current_index + 1]
        adjacent_scores.append({
            "left_image_id": image_entries[left_index]["id"],
            "right_image_id": image_entries[right_index]["id"],
            "score": round(float(similarity_matrix[left_index, right_index]), 4)
        })

    average_adjacent_score = (
        round(float(np.mean([item["score"] for item in adjacent_scores])), 4)
        if adjacent_scores else 1.0
    )

    return {
        "ordered_image_ids": [entry["id"] for entry in ordered_entries],
        "ordered_file_names": [entry["file_name"] for entry in ordered_entries],
        "adjacent_scores": adjacent_scores,
        "summary": {
            "image_count": len(ordered_entries),
            "average_adjacent_score": average_adjacent_score
        }
    }
