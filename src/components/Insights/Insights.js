import React from 'react';
import { ArrowRight16, DotMark16 } from '@carbon/icons-react';
import { PaperInner } from '../../components/Info';
import {
  Tag,
  Link,
  InlineNotification,
  Accordion,
  AccordionItem,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  Breadcrumb,
  BreadcrumbItem,
} from 'carbon-components-react';

import ShapeNode from '@carbon/charts-react/diagrams/ShapeNode';
import Edge from '@carbon/charts-react/diagrams/Edge';

let config = require('../../config.json');

let embeddings = require('../../compiler/data/Insights.json');
let static_imagination = require('./data/new_paper.json');

let taxonomy_data = require('../../compiler/data/Taxonomy.json');
let paper_data = taxonomy_data.find(
  e => e.name === config.views.find(e => e.name === 'Taxonomy').default_tab
).data;

const ShapeNodeSize = 10;
const SpecialShapeNodeSize = 20;
const fillFactor = 0.7;

class Insights extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      view: config['default_view'],
      imagination: static_imagination,
      paper_data: [],
      new_paper: null,
    };
  }

  componentDidMount(props) {
    const stageHeight = this.ref.current.offsetHeight;
    const stageWidth = this.ref.current.offsetWidth;

    const offsetX = Math.min(...embeddings.map(e => e.pos[0]));
    const maxX = Math.max(...embeddings.map(e => e.pos[0]));

    const offsetY = Math.min(...embeddings.map(e => e.pos[1]));
    const maxY = Math.max(...embeddings.map(e => e.pos[1]));

    let new_embeddings = embeddings.map(e => {
      var new_embedding = e;

      new_embedding.pos[0] =
        (fillFactor * stageWidth * (-offsetX + e.pos[0])) / (maxX - offsetX);
      new_embedding.pos[1] =
        (fillFactor * stageHeight * (-offsetY + e.pos[1])) / (maxY - offsetY);

      return new_embedding;
    });

    this.lastCenter = null;
    this.lastDist = 0;

    const new_paper_data = paper_data.map(item => {
      const embedding_item = new_embeddings.filter(e => e.id === item.UID)[0];
      var new_item = item;

      new_item['x'] =
        5 * ShapeNodeSize + this.applyScalingX(1, embedding_item.pos[0]);
      new_item['y'] =
        5 * ShapeNodeSize + this.applyScalingY(1, embedding_item.pos[1]);

      new_item.selected = false;
      return new_item;
    });

    var new_paper = { UID: 0 };
    var new_paper_embedding = new_embeddings.filter(e => e.id === 0)[0];

    new_paper['x'] =
      5 * ShapeNodeSize + this.applyScalingX(1, new_paper_embedding.pos[0]);
    new_paper['y'] =
      5 * ShapeNodeSize + this.applyScalingY(1, new_paper_embedding.pos[1]);

    if (this.ref.current) {
      this.setState({
        ...this.state,
        paper_data: new_paper_data,
        new_paper: new_paper,
      });
    }
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
        neighbor_info['selected'] = !neighbor.selected && neighbor.UID === id;

        return neighbor_info;
      }
    );

    this.setState({
      ...this.state,
      imagination: {
        ...this.state.imagination,
        neighbors: new_neighbors,
      },
    });
  }

  render() {
    const nodes = this.state.paper_data.map((paper, idx) => (
      <foreignObject
        key={idx}
        style={{ overflow: 'visible' }}
        transform={`translate(${paper.x}, ${paper.y})`}>
        <ShapeNode
          id={paper.UID}
          size={ShapeNodeSize}
          onClick={this.selectNode.bind(this, paper.UID)}
          renderIcon={<DotMark16 />}
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

    let special_node = null;
    let edges = [];

    if (this.state.new_paper) {
      special_node = (
        <foreignObject
          key={0}
          style={{ overflow: 'visible' }}
          transform={`translate(${this.state.new_paper.x}, ${this.state.new_paper.y})`}>
          <ShapeNode
            id={0}
            size={SpecialShapeNodeSize}
            onClick={this.selectNode.bind(this, this.state.new_paper.UID)}
            renderIcon={<DotMark16 />}
            className="special-circle"
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
          var target = JSON.parse(JSON.stringify(this.state.new_paper));

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

    return (
      <>
        <div
          className="bx--grid bx--grid--full-width"
          style={{
            width: '100%',
            minHeight: '100vh',
          }}>
          <Accordion align="start">
            <AccordionItem title="Tell me topics that do not have any papers!">
              <InlineNotification
                lowContrast
                hideCloseButton
                kind="error"
                title="Coming soon!"
              />
            </AccordionItem>
            <AccordionItem title="What are topics that have the least number of papers?"></AccordionItem>
            <AccordionItem title="What are most popular topics?"></AccordionItem>
            <AccordionItem title="Search papers using tags">
              <p>
                You can search papers interactively using tags in the{' '}
                <Link href="/">home</Link> page.
              </p>
            </AccordionItem>
            <AccordionItem
              className="whats-next"
              title={<>What should I work on next?! &#129299;</>}
              open>
              <StructuredListWrapper ariaLabel="New Paper">
                <StructuredListHead>
                  <StructuredListRow>
                    <StructuredListCell head>
                      New Paper Features
                    </StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                  <StructuredListRow className="no-bottom-border">
                    <StructuredListCell>
                      This is a paper, described in terms of the tags in this
                      taxonomy, that does not exist yet! It is shown below in{' '}
                      <span style={{ color: 'green' }}>green</span> in{' '}
                      <em>"tag space"</em>.
                      <br />
                      <br />
                      {this.state.imagination.key_map.map((item, idx) => {
                        const new_item = item.split(' > ');
                        const render_item = new_item.map((tag, i) => (
                          <div key={i}>
                            <Tag
                              size="sm"
                              type={
                                i === new_item.length - 1 ? 'green' : 'gray'
                              }
                              title={tag}>
                              {tag}
                            </Tag>
                            {i !== new_item.length - 1 && (
                              <ArrowRight16 className="label-connector" />
                            )}
                          </div>
                        ));

                        return (
                          <div key={idx} className="bx--row">
                            {render_item}
                          </div>
                        );
                      })}
                      <div ref={this.ref} style={{ height: '30vh' }}>
                        <svg height="100%" width="100%">
                          {edges}
                          {nodes}
                          {special_node}
                        </svg>
                      </div>
                    </StructuredListCell>
                  </StructuredListRow>
                </StructuredListBody>
              </StructuredListWrapper>

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
                      To get to this new paper, our AI thinks you should be
                      looking at the following papers known to our system as the
                      state of the art that immediately makes the new work
                      possible. Each paper is tagged with features that need
                      relaxation or extension to get to the new paper.
                      {this.state.paper_data.length > 0 && (
                        <StructuredListBody>
                          {this.state.imagination.neighbors.map(
                            (paper, idx) => (
                              <StructuredListRow
                                key={idx}
                                className={
                                  idx ===
                                  this.state.imagination.neighbors.length - 1
                                    ? 'no-bottom-border'
                                    : ''
                                }>
                                <StructuredListCell
                                  className={
                                    Boolean(paper.selected) ? 'text-blue' : ''
                                  }
                                  style={{ width: '20%' }}>
                                  <PaperInner
                                    paper={
                                      this.state.paper_data.filter((p, i) => {
                                        return p.UID === paper.UID;
                                      })[0]
                                    }
                                  />
                                </StructuredListCell>
                                <StructuredListCell style={{ width: '80%' }}>
                                  {paper.transforms.map((t, i) => {
                                    const key_split = t.key.split(' > ');
                                    const render_keys = key_split.map(
                                      (t_item, ti) => (
                                        <BreadcrumbItem
                                          key={ti}
                                          isCurrentPage={!paper.selected}>
                                          {t_item}
                                        </BreadcrumbItem>
                                      )
                                    );

                                    return (
                                      <Breadcrumb
                                        style={{ marginBottom: '5px' }}
                                        key={i}
                                        noTrailingSlash>
                                        {render_keys}
                                        <BreadcrumbItem>
                                          {t.value ? (
                                            <span className="text-blue">
                                              True
                                            </span>
                                          ) : (
                                            <span style={{ color: 'red' }}>
                                              False
                                            </span>
                                          )}
                                        </BreadcrumbItem>
                                      </Breadcrumb>
                                    );
                                  })}
                                </StructuredListCell>
                              </StructuredListRow>
                            )
                          )}
                        </StructuredListBody>
                      )}
                    </StructuredListCell>
                  </StructuredListRow>
                </StructuredListBody>
              </StructuredListWrapper>

              <InlineNotification
                lowContrast
                kind="info"
                subtitle={
                  <span>
                    In her{' '}
                    <Link
                      href="https://ojs.aaai.org/index.php/aimagazine/article/view/18149"
                      target="_blank">
                      AAAI 2020 presidential address
                    </Link>
                    , Yolanda Gil posed this question as an exploration of the
                    outsized impact AI is beginning to have on the scientific
                    process. This section builds on this theme and uses an AI
                    constraint solver to imagine new papers yet unwritten. Learn
                    more about it{' '}
                    <Link href="" target="_blank">
                      here
                    </Link>
                    .
                  </span>
                }
                title="Will AI write the scientific papers of the future?"
              />

              <InlineNotification
                lowContrast
                kind="success"
                subtitle={
                  <span>
                    We are currently working on making this section more
                    interactive so you can query the AI with parameters (like
                    existing papers and tags) to get more streamlined
                    suggestions.{' '}
                    <Link href={config.metadata.link_to_code} target="_blank">
                      Stay tuned
                    </Link>
                    ! &#129303;
                  </span>
                }
                title="Work in Progress"
              />
            </AccordionItem>
          </Accordion>
        </div>
      </>
    );
  }
}

export { Insights };
