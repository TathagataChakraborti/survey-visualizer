import React from 'react';
import { Paper } from '../../components/Info';
import { Edge, ShapeNode } from '@carbon/charts-react';
import {
    ArrowRight,
    DotMark,
    IbmCloudVirtualServerVpc,
} from '@carbon/icons-react';
import {
    computeTagChains,
    computeAllTagChains,
    NoPaperList,
    PopularTags,
} from './Trends';
import {
    Grid,
    Column,
    Tag,
    Link,
    Accordion,
    AccordionItem,
    StructuredListWrapper,
    StructuredListHead,
    StructuredListBody,
    StructuredListRow,
    StructuredListCell,
    Breadcrumb,
    BreadcrumbItem,
    MultiSelect,
    NumberInput,
    Button,
    Pagination,
    Tile,
    Loading,
    ActionableNotification,
    InlineLoading,
    Theme,
} from '@carbon/react';

import '@carbon/charts/styles.css';

let config = require('../../config.json');
let embeddings = require('../../compiler/data/Insights.json');
let taxonomy = require('../../compiler/data/Taxonomy.json');

let view_config = config.views.filter(view => view.name === 'Insights')[0];

taxonomy = taxonomy.find(
    e => e.name === config.views.find(e => e.name === 'Taxonomy').default_tab
);

let paper_data = taxonomy.data;
let taxonomy_data = taxonomy.taxonomy;
let tag_labels = computeAllTagChains(taxonomy_data);

const ShapeNodeSize = 10;
const SpecialShapeNodeSize = 20;
const fillFactor = 0.75;
const maxImagination = 5;

class Insight extends React.Component {
    constructor(props) {
        super(props);
        this.ref = React.createRef();
        this.state = {
            embeddings: embeddings,
            paper_data: paper_data,
            imagination: props.data,
            loading: false,
            error: false,
            rendered: false,
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.data !== prevProps.data)
            this.setState(
                {
                    ...this.state,
                    paper_data: this.props.paper_data,
                    imagination: this.props.data,
                },
                () => {
                    this.componentDidMount();
                }
            );
    }

    componentDidMount() {
        this.setState(
            {
                ...this.state,
                loading: true,
            },
            () => {
                fetch(config.link_to_server + '/embeddings', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify(this.state),
                })
                    .then(result => result.json())
                    .then(embeddings => {
                        const stageHeight = this.ref.current.offsetHeight;
                        const stageWidth = this.ref.current.offsetWidth;

                        const offsetX = Math.min(...embeddings.map(e => e.x));
                        const maxX = Math.max(...embeddings.map(e => e.x));
                        const offsetY = Math.min(...embeddings.map(e => e.y));
                        const maxY = Math.max(...embeddings.map(e => e.y));

                        let new_embeddings = embeddings.map(e => {
                            var new_embedding = e;
                            new_embedding.x =
                                (fillFactor * stageWidth * (-offsetX + e.x)) /
                                (maxX - offsetX);
                            new_embedding.y =
                                (fillFactor * stageHeight * (-offsetY + e.y)) /
                                (maxY - offsetY);
                            return new_embedding;
                        });

                        const new_paper_data = paper_data.map(item => {
                            const embedding_item = new_embeddings.filter(
                                e => e.UID === item.UID
                            )[0];
                            var new_item = item;
                            new_item['x'] =
                                5 * ShapeNodeSize +
                                this.applyScalingX(1, embedding_item.x);
                            new_item['y'] =
                                5 * ShapeNodeSize +
                                this.applyScalingY(1, embedding_item.y);
                            new_item.selected = false;
                            return new_item;
                        });

                        var new_paper = { UID: 0 };
                        var new_paper_embedding = new_embeddings.filter(
                            e => e.UID === 0
                        )[0];

                        new_paper['x'] =
                            5 * ShapeNodeSize +
                            this.applyScalingX(1, new_paper_embedding.x);
                        new_paper['y'] =
                            5 * ShapeNodeSize +
                            this.applyScalingY(1, new_paper_embedding.y);

                        this.setState({
                            ...this.state,
                            paper_data: new_paper_data,
                            new_paper: new_paper,
                            loading: false,
                            rendered: true,
                        });
                    })
                    .catch(data => {
                        this.setState({
                            ...this.state,
                            loading: false,
                            error: true,
                        });
                    });
            }
        );
    }

    applyScalingX(scale, x) {
        return scale * x;
    }

    applyScalingY(scale, y) {
        return scale * y;
    }

    selectNode(id, e) {
        window.scrollTo({
            top: e.pageY / 1.5,
            behavior: 'smooth',
        });

        const new_neighbors = this.state.imagination.neighbors.map(
            (neighbor, i) => {
                var neighbor_info = neighbor;
                neighbor_info['selected'] =
                    !neighbor.selected && neighbor.UID === id;

                return neighbor_info;
            }
        );

        const selected_paper_content =
            id === 0 ? null : this.state.paper_data.find(p => p.UID === id);

        this.setState({
            ...this.state,
            selected_paper_content: selected_paper_content,
            imagination: {
                ...this.state.imagination,
                neighbors: new_neighbors,
            },
        });
    }

    render() {
        let special_node = null;
        let edges = [];
        let nodes = [];

        if (this.state.rendered) {
            nodes = this.state.paper_data.map((paper, idx) => (
                <foreignObject
                    key={idx}
                    style={{ overflow: 'visible' }}
                    onClick={this.selectNode.bind(this, paper.UID)}
                    transform={`translate(${paper.x}, ${paper.y})`}>
                    <ShapeNode
                        id={paper.UID}
                        size={ShapeNodeSize}
                        renderIcon={<DotMark />}
                        title=""
                        className={
                            this.state.imagination.neighbors
                                .map(p => p.UID)
                                .indexOf(paper.UID) > -1
                                ? 'selected-circle'
                                : 'unselected-circle'
                        }
                    />
                </foreignObject>
            ));

            if (this.state.new_paper) {
                special_node = (
                    <foreignObject
                        key={0}
                        style={{ overflow: 'visible' }}
                        transform={`translate(${this.state.new_paper.x}, ${this.state.new_paper.y})`}
                        onClick={this.selectNode.bind(
                            this,
                            this.state.new_paper.UID
                        )}>
                        <ShapeNode
                            id={0}
                            size={SpecialShapeNodeSize}
                            renderIcon={<DotMark />}
                            className="special-circle"
                            title=""
                        />
                    </foreignObject>
                );

                edges = this.state.paper_data
                    .filter(
                        paper =>
                            this.state.imagination.neighbors
                                .map(p => p.UID)
                                .indexOf(paper.UID) > -1
                    )
                    .map((paper, i) => {
                        var source = JSON.parse(JSON.stringify(paper));
                        var target = JSON.parse(
                            JSON.stringify(this.state.new_paper)
                        );

                        source.x = source.x + ShapeNodeSize / 2;
                        source.y = source.y + ShapeNodeSize / 2;

                        target.x = target.x + SpecialShapeNodeSize / 2;
                        target.y = target.y + SpecialShapeNodeSize / 2;

                        return (
                            <Edge
                                key={`link_${i}`}
                                source={source}
                                target={target}
                                variant="dash-md"
                            />
                        );
                    });
            }
        }
        return (
            <Grid>
                <Column lg={16} md={8} sm={4}>
                    <br />
                    <div style={{ width: '75%' }}>
                        <Tile>
                            <p style={{ fontSize: 'inherit' }}>
                                This is a paper, described in terms of the tags
                                in this taxonomy, that does not exist yet! It is
                                shown below in{' '}
                                <span style={{ color: 'green' }}>green</span> in{' '}
                                <em>"tag space"</em>.
                            </p>
                        </Tile>
                    </div>
                    <br />

                    {this.state.imagination.key_map.map((item, idx) => {
                        const new_item = item.split(' > ');
                        const render_item = new_item.map((tag, i) => (
                            <div style={{ display: 'inline' }} key={i}>
                                <Tag
                                    className="topic-tag"
                                    size="sm"
                                    type={
                                        i === new_item.length - 1
                                            ? 'green'
                                            : 'gray'
                                    }
                                    title={tag}>
                                    {tag}
                                </Tag>
                                {i !== new_item.length - 1 && (
                                    <ArrowRight className="label-connector" />
                                )}
                            </div>
                        ));

                        return <div key={idx}>{render_item}</div>;
                    })}

                    {this.state.loading && (
                        <>
                            <br />
                            <br />
                            <InlineLoading description="Loading new paper embeddings..." />
                        </>
                    )}

                    {this.state.error && (
                        <>
                            <br />
                            <br />

                            <ActionableNotification
                                actionButtonLabel="Report Issue"
                                aria-label="close notification"
                                lowContrast
                                closeOnEscape
                                kind="error"
                                onActionButtonClick={() => {
                                    window.open(
                                        config.metadata.link_to_code +
                                            '/issues',
                                        '_blank'
                                    );
                                }}
                                statusIconDescription="error"
                                subtitle="There was an error rendering new paper embedding. "
                                title="ERROR"
                            />
                        </>
                    )}

                    <div ref={this.ref} style={{ height: '500px' }}>
                        {!this.state.loading && !this.state.error && (
                            <svg height="100%" width="100%">
                                {edges}
                                {nodes}
                                {special_node}
                            </svg>
                        )}
                    </div>

                    {this.state.selected_paper_content && (
                        <Paper paper={this.state.selected_paper_content} />
                    )}
                </Column>

                <Column lg={16} md={8} sm={4}>
                    <br />
                    <StructuredListWrapper ariaLabel="Neighboring Papers">
                        <StructuredListHead>
                            <StructuredListRow>
                                <StructuredListCell head>
                                    Neighboring Papers
                                </StructuredListCell>
                            </StructuredListRow>
                        </StructuredListHead>
                        <StructuredListBody>
                            <StructuredListRow>
                                <StructuredListCell>
                                    To get to this new paper, our AI thinks you
                                    should be looking at the following papers
                                    known to our system as the state of the art
                                    that immediately makes the new work
                                    possible. Each paper is tagged with features
                                    that need relaxation or extension to get to
                                    the new paper.
                                </StructuredListCell>
                            </StructuredListRow>
                            {this.state.paper_data.length > 0 && (
                                <>
                                    {this.state.imagination.neighbors.map(
                                        (paper, idx) => (
                                            <StructuredListRow
                                                key={idx}
                                                className={
                                                    idx ===
                                                    this.state.imagination
                                                        .neighbors.length -
                                                        1
                                                        ? 'no-bottom-border'
                                                        : ''
                                                }>
                                                <StructuredListCell
                                                    className={
                                                        Boolean(paper.selected)
                                                            ? 'text-blue'
                                                            : ''
                                                    }
                                                    style={{
                                                        width: '20%',
                                                    }}>
                                                    <Theme theme="g10">
                                                        <Paper
                                                            paper={
                                                                this.state.paper_data.filter(
                                                                    (p, i) => {
                                                                        return (
                                                                            p.UID ===
                                                                            paper.UID
                                                                        );
                                                                    }
                                                                )[0]
                                                            }
                                                        />
                                                    </Theme>
                                                    <br />
                                                    {paper.transforms.map(
                                                        (t, i) => {
                                                            const key_split = t.key.split(
                                                                ' > '
                                                            );
                                                            const render_keys = key_split.map(
                                                                (
                                                                    t_item,
                                                                    ti
                                                                ) => (
                                                                    <BreadcrumbItem
                                                                        key={ti}
                                                                        isCurrentPage={
                                                                            !paper.selected
                                                                        }>
                                                                        {t_item}
                                                                    </BreadcrumbItem>
                                                                )
                                                            );

                                                            return (
                                                                <Breadcrumb
                                                                    style={{
                                                                        marginBottom:
                                                                            '5px',
                                                                    }}
                                                                    key={i}
                                                                    noTrailingSlash>
                                                                    {
                                                                        render_keys
                                                                    }
                                                                    <BreadcrumbItem>
                                                                        {t.value ? (
                                                                            <span className="text-blue">
                                                                                True
                                                                            </span>
                                                                        ) : (
                                                                            <span
                                                                                style={{
                                                                                    color:
                                                                                        'red',
                                                                                }}>
                                                                                False
                                                                            </span>
                                                                        )}
                                                                    </BreadcrumbItem>
                                                                </Breadcrumb>
                                                            );
                                                        }
                                                    )}
                                                </StructuredListCell>
                                            </StructuredListRow>
                                        )
                                    )}
                                </>
                            )}
                        </StructuredListBody>
                    </StructuredListWrapper>
                </Column>
            </Grid>
        );
    }
}

class Insights extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            view: config.default_view,
            paper_data: paper_data,
            taxonomy_data: taxonomy_data,
            pageID: 1,
            pageMAX: 1,
            new_papers: [],
            selected_papers: [],
            selected_tags: [],
            num_papers: 1,
            server_status: 'error',
            loading: false,
            error: false,
        };

        this.updateSelectedTab();
    }

    componentDidMount() {}

    componentDidUpdate(prevProps, prevState) {
        if (this.props.props !== prevProps.props)
            this.setState({
                ...this.state,
                paper_data: this.props.props,
            });
    }

    changeNumePapers = e => {
        this.setState({
            ...this.state,
            num_papers: parseInt(e.imaginaryTarget.value),
        });
    };

    logPaperSelection = e => {
        this.setState({
            ...this.state,
            selected_papers: e.map(item => item.id),
        });
    };

    logTagSelection = e => {
        this.setState({
            ...this.state,
            selected_tags: e.map(item => item.text),
        });
    };

    updateSelectedTab(e) {
        this.props.updateSelectedTab(this.state.paper_data, []);
    }

    bringUpServer(e) {
        this.setState(
            {
                ...this.state,
                server_status: 'active',
            },
            () => {
                fetch(config.link_to_server + '/hello', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                })
                    .then(result => result.json())
                    .then(data => {
                        if (data.status) {
                            this.setState({
                                ...this.state,
                                server_status: 'finished',
                            });
                        } else {
                            this.setState({
                                ...this.state,
                                server_status: 'error',
                            });
                        }
                    })
                    .catch(data => {
                        this.setState({
                            ...this.state,
                            server_status: 'error',
                        });
                    });
            }
        );
    }

    imaginePapers(e) {
        this.setState(
            {
                ...this.state,
                loading: true,
                error: false,
                new_papers: [],
            },
            () => {
                const temp_paper_data = this.state.paper_data.map(
                    (paper, i) => {
                        var new_paper = JSON.parse(JSON.stringify(paper));
                        new_paper['tag_chain'] = computeTagChains(
                            new_paper,
                            tag_labels
                        );

                        return new_paper;
                    }
                );

                const payload = {
                    paper_data: temp_paper_data,
                    selected_papers: this.state.selected_papers.length
                        ? this.state.selected_papers
                        : this.state.paper_data.map(i => i.UID),
                    selected_tags: this.state.selected_tags.length
                        ? this.state.selected_tags
                        : tag_labels,
                    num_papers: this.state.num_papers,
                    domain: config.metadata.acronym,
                };

                fetch(config.link_to_server + '/imagine', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify(payload),
                })
                    .then(result => result.json())
                    .then(data => {
                        this.setState({
                            ...this.state,
                            new_papers: data,
                            loading: false,
                        });
                    })
                    .catch(data => {
                        this.setState({
                            ...this.state,
                            loading: false,
                            error: true,
                        });
                    });
            }
        );
    }

    render() {
        return (
            <div
                style={{
                    width: '100%',
                    minHeight: '100vh',
                }}>
                <Accordion align="start">
                    <AccordionItem title="Tell me topics that do not have any papers!">
                        <NoPaperList
                            tag_labels={tag_labels}
                            paper_data={this.state.paper_data}
                        />
                    </AccordionItem>
                    <AccordionItem title="What are topics that have the least number of papers?">
                        <PopularTags
                            slice_to={10}
                            direction="increasing"
                            tag_labels={tag_labels}
                            paper_data={this.state.paper_data}
                        />
                    </AccordionItem>
                    <AccordionItem title="What are most popular topics?">
                        <PopularTags
                            direction="decreasing"
                            tag_labels={tag_labels}
                            paper_data={this.state.paper_data}
                        />
                    </AccordionItem>
                    <AccordionItem title="Search papers using tags">
                        <p>
                            You can search papers interactively using tags in
                            the <Link href="/">home</Link> page.
                        </p>
                    </AccordionItem>
                    <AccordionItem
                        className="whats-next"
                        title={<>What should I work on next?! &#129299;</>}
                        open>
                        <p style={{ fontSize: 'inherit' }}>
                            In her{' '}
                            <Link
                                href="https://ojs.aaai.org/index.php/aimagazine/article/view/18149"
                                target="_blank">
                                AAAI 2020 presidential address
                            </Link>
                            , Yolanda Gil asked:{' '}
                            <em>
                                "Will AI write the scientific papers of the
                                future?"
                            </em>{' '}
                            to put into context the outsized impact that AI is
                            beginning to have on the scientific process. This
                            section builds on this theme and uses an AI
                            constraint solver to imagine new papers yet
                            unwritten. Learn more about it{' '}
                            <Link href="" target="_blank">
                                here
                            </Link>
                            .
                        </p>

                        <br />
                        <br />

                        {view_config.interactive && (
                            <>
                                <MultiSelect
                                    helperText="You can make the new paper search focus on papers of interest. If nothing is selected, the system will work with all the papers."
                                    id="multiselect-paper"
                                    itemToString={item =>
                                        item ? item.text : ''
                                    }
                                    items={this.state.paper_data.map(
                                        (paper, i) => {
                                            return {
                                                id: i,
                                                text:
                                                    paper.title +
                                                    ' by ' +
                                                    paper.authors,
                                            };
                                        }
                                    )}
                                    label="List of papers"
                                    titleText={
                                        <>
                                            <span style={{ color: 'red' }}>
                                                Optional
                                            </span>{' '}
                                            Select list of papers you want to
                                            focus on
                                        </>
                                    }
                                    initialSelectedItems={
                                        this.state.selected_papers
                                    }
                                    onChange={value => {
                                        this.logPaperSelection(
                                            value.selectedItems
                                        );
                                    }}
                                />

                                <br />
                                <br />

                                <MultiSelect
                                    helperText="You can make the new paper search focus on tags of interest. If nothing is selected, the system will work with all the tags."
                                    id="multiselect-tags"
                                    itemToString={item =>
                                        item ? item.text : ''
                                    }
                                    items={tag_labels}
                                    label="List of tags"
                                    titleText={
                                        <>
                                            <span style={{ color: 'red' }}>
                                                Optional
                                            </span>{' '}
                                            Select list of tags you want to
                                            focus on
                                        </>
                                    }
                                    initialSelectedItems={
                                        this.state.selected_tags
                                    }
                                    onChange={value => {
                                        this.logTagSelection(
                                            value.selectedItems
                                        );
                                    }}
                                />

                                <br />
                                <br />
                            </>
                        )}

                        <Grid>
                            <Column lg={16} md={8} sm={4}>
                                <Tile>
                                    <InlineLoading
                                        status={this.state.server_status}
                                        description="Server status"
                                    />

                                    <br />

                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            this.bringUpServer();
                                        }}
                                        kind="tertiary"
                                        renderIcon={IbmCloudVirtualServerVpc}>
                                        Bring up server
                                    </Button>

                                    <p className="button-text">
                                        Click here to bring up the server. If
                                        you are using the tool after a long
                                        time, the server might be asleep and
                                        take up to a minute to wake up. Once you
                                        get the green light, you can click{' '}
                                        <em>What's next?</em>.
                                    </p>
                                </Tile>
                                <br />
                                <br />
                            </Column>

                            <Column lg={4} md={4} sm={4}>
                                <NumberInput
                                    helperText={
                                        <>
                                            <span style={{ color: 'red' }}>
                                                Optional
                                            </span>{' '}
                                            Number of papers
                                        </>
                                    }
                                    id="num-papers"
                                    invalidText="Number is not valid"
                                    max={maxImagination}
                                    min={1}
                                    step={1}
                                    value={this.state.num_papers}
                                    onChange={this.changeNumePapers.bind(this)}
                                    size="sm"
                                />
                            </Column>
                            <Column lg={4} md={4} sm={4}>
                                <Button
                                    disabled={
                                        this.state.server_status !== 'finished'
                                    }
                                    kind="primary"
                                    size="sm"
                                    onClick={this.imaginePapers.bind(this)}>
                                    What's Next
                                </Button>
                            </Column>
                        </Grid>

                        {this.state.loading && (
                            <div style={{ padding: '50px' }}>
                                <Loading
                                    style={{ margin: '0 auto' }}
                                    description="Active loading indicator"
                                    withOverlay={false}
                                />
                            </div>
                        )}

                        {this.state.error && (
                            <>
                                <br />
                                <br />

                                <ActionableNotification
                                    actionButtonLabel="Report Issue"
                                    aria-label="close notification"
                                    lowContrast
                                    closeOnEscape
                                    kind="error"
                                    onActionButtonClick={() => {
                                        window.open(
                                            config.metadata.link_to_code +
                                                '/issues',
                                            '_blank'
                                        );
                                    }}
                                    statusIconDescription="error"
                                    subtitle="There was an error contacting the server. "
                                    title="ERROR"
                                />
                            </>
                        )}

                        {this.state.new_papers.length > 0 && (
                            <div>
                                <br />
                                <br />

                                <Pagination
                                    backwardText="Previous paper"
                                    forwardText="Next paper"
                                    itemsPerPageText="Papers per page:"
                                    page={1}
                                    pageSize={1}
                                    pageSizes={[
                                        ...Array(
                                            this.state.new_papers.length
                                        ).keys(),
                                    ].map(i => i + 1)}
                                    size="md"
                                    totalItems={this.state.new_papers.length}
                                    onChange={e => {
                                        this.setState({
                                            ...this.state,
                                            pageID: e.page,
                                            pageMAX: e.pageSize,
                                        });
                                    }}
                                />

                                {[
                                    ...Array(
                                        this.state.new_papers.length
                                    ).keys(),
                                ].map((item, idx) => {
                                    if (
                                        idx >=
                                            (this.state.pageID - 1) *
                                                this.state.pageMAX &&
                                        idx <
                                            this.state.pageID *
                                                this.state.pageMAX
                                    ) {
                                        return (
                                            <Insight
                                                key={idx}
                                                paper_data={
                                                    this.state.paper_data
                                                }
                                                data={
                                                    this.state.new_papers[idx]
                                                }
                                            />
                                        );
                                    } else {
                                        return null;
                                    }
                                })}
                            </div>
                        )}

                        <br />
                        <br />
                    </AccordionItem>
                </Accordion>
            </div>
        );
    }
}

export { Insights };
