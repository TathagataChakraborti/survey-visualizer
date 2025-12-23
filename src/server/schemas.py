from pydantic import BaseModel
from typing import List, Union, Optional
from enum import StrEnum, auto


class ServerStatus(BaseModel):
    status: bool


class Domain(StrEnum):
    @staticmethod
    def _generate_next_value_(name, *args):
        return name

    MACQ = auto()
    VAMHRI = auto()
    XAIP = auto()


class PaperTag(BaseModel):
    name: str
    parent: Optional[str]


class Tag(BaseModel):
    id: int
    text: str


class Paper(BaseModel):
    UID: int
    slug: str
    title: str
    abstract: str
    authors: Union[str, List[str]]
    venue: str
    sessions: Optional[str] = None
    year: int
    keywords: Optional[Union[str, List[str]]] = []
    tags: List[PaperTag]
    citations: List[int]
    selected: bool = True


class RequestData(BaseModel):
    domain: Domain
    num_papers: int
    paper_data: List[Paper]
    selected_papers: List[int]
    selected_tags: List[Tag]


class Transform(BaseModel):
    key: str
    value: bool


class Neighbor(BaseModel):
    UID: int
    transforms: List[Transform] = []


class NewPaperData(BaseModel):
    key_map: List[str]
    neighbors: List[Neighbor] = []


class Embedding(BaseModel):
    UID: int
    x: float
    y: float


class EmbeddingRequest(BaseModel):
    paper_data: List[Paper]
    embeddings: List[Embedding]
    imagination: NewPaperData
