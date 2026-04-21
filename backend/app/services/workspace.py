from pathlib import Path


def get_workspace_root() -> Path:
    return Path(__file__).resolve().parents[1] / "workspace"


def get_project_workspace(project_id: str) -> Path:
    return get_workspace_root() / project_id


def get_project_images_dir(project_id: str) -> Path:
    return get_project_workspace(project_id) / "images"
