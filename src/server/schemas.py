from pydantic import BaseModel
from typing import List, Union
from enum import Enum


class Domain(Enum):
    MACQ = "macq"
    VAMHRI = "vamhri"
    XAIP = "xaip"

    @classmethod
    def map_to_value(cls, incoming_value):
        temp = incoming_value.lower().replace("-", "_")
        list_of_names = list(cls._value2member_map_.keys())

        return list_of_names[list_of_names.index(temp)]


class Paper(BaseModel):
    UID: int
    slug: str
    title: str
    abstract: str
    authors: Union[str, List[str]]
    venue: str
    sessions: str
    year: int
    keywords: Union[str, List[str]]
    tags: List[str]
    citations: List[int]
    selected: bool = True


class RequestData(BaseModel):
    domain: Domain
    num_papers: int
    paper_data: List[Paper]
    selected_papers: List[int]
    selected_tags: List[str]


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
