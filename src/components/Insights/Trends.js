import { ContainedList, ContainedListItem, Tag } from '@carbon/react';

const filterContained = tag_chain => {
    var filtered_chain = [];

    tag_chain.forEach(item => {
        var is_contained = false;

        tag_chain.forEach(tag => {
            is_contained = is_contained || (item !== tag && tag.includes(item));
        });

        if (!is_contained) {
            filtered_chain.push(item);
        }
    });

    return filtered_chain;
};

const computeAllTagChains = taxonomy_data => {
    let tag_labels = [];

    taxonomy_data.forEach((taxonomy_level, level) => {
        taxonomy_level.forEach((taxonomy_item, idx) => {
            var new_item = [];

            if (taxonomy_item.parent) {
                tag_labels.forEach((known_item, i) => {
                    if (
                        taxonomy_item.parent ===
                        known_item[known_item.length - 1]
                    ) {
                        var new_item = known_item.map(e => e);
                        new_item.push(taxonomy_item.name);
                        tag_labels.push(new_item);
                    }
                });
            } else {
                new_item.push(taxonomy_item.name);
                tag_labels.push(new_item);
            }
        });
    });

    tag_labels = tag_labels.map((item, i) => {
        return { id: i, text: item.join(' > ') };
    });

    return tag_labels;
};

const computeTagChains = (paper, tag_labels) => {
    var tag_chain = [];

    paper.tags.forEach(tag => {
        var temp_c = [];
        if (tag.parent) temp_c = [tag.parent];

        temp_c.push(tag.name);
        var temp_c_for_check = temp_c.join(' > ');

        tag_labels.forEach(reference => {
            if (reference.text.endsWith(temp_c_for_check)) {
                tag_chain.push(reference.text);
                return false;
            }
        });
    });

    return filterContained(tag_chain);
};

const computeTagMap = (paper_data, tag_labels) => {
    var keys = tag_labels.map(item => item.text);
    var filtered_keys = filterContained(keys);
    var tag_map = Object.fromEntries(filtered_keys.map(key => [key, 0]));

    paper_data.forEach(paper => {
        const paper_tags = computeTagChains(paper, tag_labels);
        paper_tags.forEach(item => {
            tag_map[item] += 1;
        });
    });

    return tag_map;
};

const NoPaperList = props => {
    const tag_map = computeTagMap(props.paper_data, props.tag_labels);
    const tags_with_no_papers = Object.keys(tag_map).filter(
        key => tag_map[key] === 0
    );

    return (
        <ContainedList
            isInset
            kind="on-page"
            label="Tags with no papers"
            size="sm">
            {tags_with_no_papers.map(tag => (
                <ContainedListItem>{tag}</ContainedListItem>
            ))}

            {tags_with_no_papers.length === 0 && (
                <ContainedListItem>No paperless tags found!</ContainedListItem>
            )}
        </ContainedList>
    );
};

const PopularTags = props => {
    const tag_map = computeTagMap(props.paper_data, props.tag_labels);
    const slice_to = props.slice_to ? props.slice_to : 5;

    var tag_map_list = Object.keys(tag_map)
        .map(key => {
            return { tag: key, number: tag_map[key] };
        })
        .filter(item => item.number > 0);

    if (props.direction === 'decreasing') {
        tag_map_list.sort((a, b) => b.number - a.number);
    } else {
        tag_map_list.sort((a, b) => a.number - b.number);
    }

    return (
        <ContainedList
            isInset
            kind="on-page"
            label={slice_to + ' Most Popular Tags'}
            size="sm">
            {tag_map_list.slice(0, slice_to).map(item => (
                <ContainedListItem>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}>
                        <div>{item.tag}</div>
                        <div>
                            <Tag
                                className="flattened_tags"
                                title={item.number}
                                type={
                                    props.direction === 'decreasing'
                                        ? 'blue'
                                        : 'magenta'
                                }
                                sie="sm">
                                {item.number}
                            </Tag>
                        </div>
                    </div>
                </ContainedListItem>
            ))}
        </ContainedList>
    );
};

export { computeAllTagChains, computeTagChains, NoPaperList, PopularTags };
