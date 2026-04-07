"""Compatibility wrapper for `law_open_api_crawler`.

The reference code used a different crawler structure and project dependencies.
This module keeps our current implementation and exposes the same entry points
under the `las_open_api` name when that spelling is used in this project.
"""

try:
    from .law_open_api_crawler import (  # type: ignore[attr-defined] # noqa: F401
        LawSearchItem,
        PrecedentSearchItem,
        crawl_law_open_api,
        crawl_precedent_open_api,
        fetch_law_search_results,
        fetch_precedent_detail,
        fetch_precedent_search_results,
        fetch_public_law_html,
        normalize_law_items,
        normalize_precedent_items,
        save_law_search_results,
        save_precedent_results,
    )
except ImportError:
    from law_open_api_crawler import (  # noqa: F401
        LawSearchItem,
        PrecedentSearchItem,
        crawl_law_open_api,
        crawl_precedent_open_api,
        fetch_law_search_results,
        fetch_precedent_detail,
        fetch_precedent_search_results,
        fetch_public_law_html,
        normalize_law_items,
        normalize_precedent_items,
        save_law_search_results,
        save_precedent_results,
    )
