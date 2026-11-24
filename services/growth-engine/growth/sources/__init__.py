from .facebook import FacebookSource
from .instagram import InstagramSource

SOURCES = {
    "facebook": FacebookSource(),
    "instagram": InstagramSource(),
}
