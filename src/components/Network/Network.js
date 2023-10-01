import React from 'react';
import { InlineNotification } from '@carbon/react';
import { ForceGraph } from './observablehq.js';
import { Simulate, TagArea } from '../../components/Info';

let paper_data = require('../../compiler/data/Network.json');

const initWidth = 800;
const initHeight = 600;

class Chart extends React.Component {
    constructor(props) {
        super(props);
        this.svg = React.createRef();
        this.state = {};
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props !== prevProps) {
            this.chart = ForceGraph(this.props.data, {
                nodeId: d => d.UID,
                nodeGroup: d => d.group,
                nodeTitle: d =>
                    `${d.title}. ${d.authors}. ${d.venue}. (${d.year})`,
                linkStrokeWidth: l => Math.sqrt(l.value),
                width: this.props.width,
                height: this.props.height,
            });

            this.svg.current.innerHTML = '';
            this.svg.current.appendChild(this.chart);
        }
    }

    render() {
        return <div ref={this.svg} />;
    }
}

class Network extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            node_data: paper_data.nodes,
            link_data: this.filter_links_by_nodes(
                paper_data.nodes,
                paper_data.links
            ),
            width: initWidth,
            height: initHeight,
            years: this.props.years,
        };

        this.ref = React.createRef();
        this.updateSelectedTab();
    }

    componentDidMount(props) {
        if (this.ref.current) {
            this.setState({
                ...this.state,
                width: this.ref.current.offsetWidth,
                height: this.ref.current.offsetHeight,
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.props !== prevProps.props) {
            const node_data = this.props.props;
            const link_data = this.filter_links_by_nodes(
                node_data,
                paper_data.links
            );

            this.setState({
                ...this.state,
                node_data: node_data,
                link_data: link_data,
                years: this.props.years,
            });
        }
    }

    updateSelectedTab(e) {
        this.props.updateSelectedTab(this.state.node_data, []);
    }

    mouseUpGlobal(e) {
        this.setState({
            ...this.state,
            slide_on: false,
        });
    }

    handleSimulate(e) {
        this.setState(
            {
                ...this.state,
                slide_on: true,
            },
            () => {
                this.props.handleSimulate(e);
            }
        );
    }

    filter_links_by_nodes(nodes, links) {
        return links.filter(e => {
            var is_link = nodes.reduce(
                (is_link, node) => (is_link = is_link || e.source === node.UID),
                false
            );
            is_link =
                is_link &&
                nodes.reduce(
                    (is_link, node) =>
                        (is_link = is_link || e.target === node.UID),
                    false
                );

            return is_link;
        });
    }

    updateTagSelection(filter_tags) {
        const node_data = paper_data.nodes.filter(
            paper =>
                filter_tags.filter(tag =>
                    new Set(paper.tags.map(t => t.name)).has(tag)
                ).length > 0 || filter_tags.length === 0
        );

        this.setState(
            {
                ...this.state,
                node_data: node_data,
                link_data: this.filter_links_by_nodes(
                    node_data,
                    paper_data.links
                ),
            },
            () => {
                this.updateSelectedTab();
            }
        );
    }

    render() {
        return (
            <div
                className="cds--container"
                onMouseUp={this.mouseUpGlobal.bind(this)}>
                <InlineNotification
                    subtitle={
                        <span>
                            This network shows how papers here point to each
                            other. Hover over a node to see its identity. The
                            connections are parsed automatically from PDFs.{' '}
                            <strong>This process is somewhat noisy.</strong> We
                            hope to improve it over time.
                        </span>
                    }
                    title="Citation Network"
                    kind="info"
                    lowContrast
                />
                <br />

                <Simulate
                    data={this.state.node_data}
                    years={this.state.years}
                    handleSimulate={this.handleSimulate.bind(this)}
                    slide_on={this.state.slide_on}
                />

                <br />
                <br />

                <div ref={this.ref} style={{ height: '50vh' }}>
                    <Chart
                        data={{
                            nodes: this.state.node_data,
                            links: this.state.link_data,
                        }}
                        width={this.state.width}
                        height={this.state.height}
                    />
                </div>

                <br />
                <br />

                <TagArea
                    data={this.state.node_data}
                    updateTagSelection={this.updateTagSelection.bind(this)}
                />
            </div>
        );
    }
}

export { Network };
