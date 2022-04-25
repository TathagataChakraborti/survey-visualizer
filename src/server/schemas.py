import enum
from typing import List, Union, Dict, TypedDict


class Domain(enum.Enum):
    MACQ = "macq"
    VAMHRI = "vam_hri"
    XAIP = "xaip"

    @classmethod
    def map_to_value(cls, incoming_value):
        temp = incoming_value.lower().replace("-", "_")
        list_of_names = list(cls._value2member_map_.keys())

        return list_of_names[list_of_names.index(temp)]


class Paper(TypedDict):
    UID: int
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


class RequestData(TypedDict):
    domain: Domain
    num_papers: int
    paper_data: List[Paper]
    selected_papers: List[int]
    selected_tags: List[str]


class Transform(TypedDict):
    key: str
    value: bool


class Neighbor(TypedDict):
    UID: int
    transforms: List[Transform]


class NewPaperData(TypedDict):
    key_map: List[str]
    neighbors: List[Neighbor]


class EmbeddingRequest(TypedDict):
    paper_data: List[Paper]
    imagination: NewPaperData


class Embedding(TypedDict):
    _id: int
    x: float
    y: float
