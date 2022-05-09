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
  MultiSelect,
  NumberInput,
  Button,
  Pagination,
  Tile,
  Loading,
  ToastNotification,
  InlineLoading,
} from 'carbon-components-react';

import ShapeNode from '@carbon/charts-react/diagrams/ShapeNode';
import Edge from '@carbon/charts-react/diagrams/Edge';

let config = require('../../config.json');
let view_config = config.views.filter(view => view.name === 'Insights')[0];

let embeddings = require('../../compiler/data/Insights.json');
let taxonomy = require('../../compiler/data/Taxonomy.json');
taxonomy = taxonomy.find(
  e => e.name === config.views.find(e => e.name === 'Taxonomy').default_tab
);

let paper_data = taxonomy.data;
let taxonomy_data = taxonomy.taxonomy;
let tag_labels = [];

taxonomy_data.forEach((taxonomy_level, level) => {
  taxonomy_level.forEach((taxonomy_item, idx) => {
    var new_item = [];

    if (taxonomy_item.parent) {
      tag_labels.forEach((known_item, i) => {
        if (taxonomy_item.parent === known_item[known_item.length - 1]) {
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
                (fillFactor * stageWidth * (-offsetX + e.x)) / (maxX - offsetX);
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
                5 * ShapeNodeSize + this.applyScalingX(1, embedding_item.x);
              new_item['y'] =
                5 * ShapeNodeSize + this.applyScalingY(1, embedding_item.y);
              new_item.selected = false;
              return new_item;
            });

            var new_paper = { UID: 0 };
            var new_paper_embedding = new_embeddings.filter(
              e => e.UID === 0
            )[0];

            new_paper['x'] =
              5 * ShapeNodeSize + this.applyScalingX(1, new_paper_embedding.x);
            new_paper['y'] =
              5 * ShapeNodeSize + this.applyScalingY(1, new_paper_embedding.y);

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
    let special_node = null;
    let edges = [];
    let nodes = [];

    if (this.state.rendered) {
      nodes = this.state.paper_data.map((paper, idx) => (
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
    }
    return (
      <>
        <div className="bx--col-lg-16">
          <br />
          <div className="bx--row" style={{ width: '75%' }}>
            <Tile>
              <p style={{ fontSize: 'inherit' }}>
                This is a paper, described in terms of the tags in this
                taxonomy, that does not exist yet! It is shown below in{' '}
                <span style={{ color: 'green' }}>green</span> in{' '}
                <em>"tag space"</em>.
              </p>
            </Tile>
          </div>
          <br />

          {this.state.imagination.key_map.map((item, idx) => {
            const new_item = item.split(' > ');
            const render_item = new_item.map((tag, i) => (
              <div key={i}>
                <Tag
                  size="sm"
                  type={i === new_item.length - 1 ? 'green' : 'gray'}
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
          <br />
          <br />

          {this.state.loading && (
            <InlineLoading description="Loading new paper embeddings..." />
          )}

          {this.state.error && (
            <>
              <br />
              <br />
              <ToastNotification
                lowContrast
                subtitle={
                  <span>
                    There was an error rendering the new paper embedding. Please
                    report a bug{' '}
                    <Link
                      href={config['metadata']['link_to_code'] + '/issues'}
                      target="_blank">
                      here
                    </Link>
                    .
                  </span>
                }
                title="ERROR"
              />
            </>
          )}

          <div ref={this.ref} style={{ height: '30vh' }}>
            {!this.state.loading && !this.state.error && (
              <svg height="100%" width="100%">
                {edges}
                {nodes}
                {special_node}
              </svg>
            )}
          </div>
        </div>

        <StructuredListWrapper ariaLabel="Neighboring Papers">
          <StructuredListHead>
            <StructuredListRow>
              <StructuredListCell head>Neighboring Papers</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            <StructuredListRow>
              <StructuredListCell>
                To get to this new paper, our AI thinks you should be looking at
                the following papers known to our system as the state of the art
                that immediately makes the new work possible. Each paper is
                tagged with features that need relaxation or extension to get to
                the new paper.
                {this.state.paper_data.length > 0 && (
                  <StructuredListBody>
                    {this.state.imagination.neighbors.map((paper, idx) => (
                      <StructuredListRow
                        key={idx}
                        className={
                          idx === this.state.imagination.neighbors.length - 1
                            ? 'no-bottom-border'
                            : ''
                        }>
                        <StructuredListCell
                          className={Boolean(paper.selected) ? 'text-blue' : ''}
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
                            const render_keys = key_split.map((t_item, ti) => (
                              <BreadcrumbItem
                                key={ti}
                                isCurrentPage={!paper.selected}>
                                {t_item}
                              </BreadcrumbItem>
                            ));

                            return (
                              <Breadcrumb
                                style={{ marginBottom: '5px' }}
                                key={i}
                                noTrailingSlash>
                                {render_keys}
                                <BreadcrumbItem>
                                  {t.value ? (
                                    <span className="text-blue">True</span>
                                  ) : (
                                    <span style={{ color: 'red' }}>False</span>
                                  )}
                                </BreadcrumbItem>
                              </Breadcrumb>
                            );
                          })}
                        </StructuredListCell>
                      </StructuredListRow>
                    ))}
                  </StructuredListBody>
                )}
              </StructuredListCell>
            </StructuredListRow>
          </StructuredListBody>
        </StructuredListWrapper>
      </>
    );
  }
}

class Insights extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: config['default_view'],
      paper_data: paper_data,
      taxonomy_data: taxonomy_data,
      pageID: 1,
      pageMAX: 1,
      new_papers: [],
      selected_papers: [],
      selected_tags: [],
      num_papers: 1,
      loading: false,
      error: false,
    };

    this.updateSelectedTab();
  }

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

  imaginePapers(e) {
    this.setState(
      {
        ...this.state,
        loading: true,
        error: false,
        new_papers: [],
      },
      () => {
        const temp_paper_data = this.state.paper_data.map((paper, i) => {
          var new_paper = JSON.parse(JSON.stringify(paper));
          var tag_chain = [];

          new_paper.tags.forEach(tag => {
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

          new_paper['tag_chain'] = tag_chain;
          return new_paper;
        });

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
            <AccordionItem title="What are topics that have the least number of papers?">
              <InlineNotification
                lowContrast
                hideCloseButton
                kind="error"
                title="Coming soon!"
              />
            </AccordionItem>
            <AccordionItem title="What are most popular topics?">
              <InlineNotification
                lowContrast
                hideCloseButton
                kind="error"
                title="Coming soon!"
              />
            </AccordionItem>
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
              <p style={{ fontSize: 'inherit' }}>
                In her{' '}
                <Link
                  href="https://ojs.aaai.org/index.php/aimagazine/article/view/18149"
                  target="_blank">
                  AAAI 2020 presidential address
                </Link>
                , Yolanda Gil asked:{' '}
                <em>"Will AI write the scientific papers of the future?"</em> to
                put into context the outsized impact that AI is beginning to
                have on the scientific process. This section builds on this
                theme and uses an AI constraint solver to imagine new papers yet
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
                    itemToString={item => (item ? item.text : '')}
                    items={this.state.paper_data.map((paper, i) => {
                      return {
                        id: i,
                        text: paper.title + ' by ' + paper.authors,
                      };
                    })}
                    label="List of papers"
                    titleText={
                      <>
                        <span style={{ color: 'red' }}>Optional</span> Select
                        list of papers you want to focus on
                      </>
                    }
                    initialSelectedItems={this.state.selected_papers}
                    onChange={value => {
                      this.logPaperSelection(value.selectedItems);
                    }}
                  />

                  <br />
                  <br />

                  <MultiSelect
                    helperText="You can make the new paper search focus on tags of interest. If nothing is selected, the system will work with all the tags."
                    id="multiselect-tags"
                    itemToString={item => (item ? item.text : '')}
                    items={tag_labels}
                    label="List of tags"
                    titleText={
                      <>
                        <span style={{ color: 'red' }}>Optional</span> Select
                        list of tags you want to focus on
                      </>
                    }
                    initialSelectedItems={this.state.selected_tags}
                    onChange={value => {
                      this.logTagSelection(value.selectedItems);
                    }}
                  />

                  <br />
                  <br />
                </>
              )}

              <div className="bx--row">
                <div className="bx--col-lg-4">
                  <NumberInput
                    helperText={
                      <>
                        <span style={{ color: 'red' }}>Optional</span> Number of
                        papers
                      </>
                    }
                    id="num-papers"
                    invalidText="Number is not valid"
                    max={maxImagination}
                    min={1}
                    step={1}
                    value={this.state.num_papers}
                    onChange={this.changeNumePapers.bind(this)}
                  />
                </div>
                <div className="bx--col-lg-4">
                  <Button
                    kind="primary"
                    size="field"
                    onClick={this.imaginePapers.bind(this)}>
                    What's Next
                  </Button>
                </div>
              </div>

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
                  <ToastNotification
                    lowContrast
                    subtitle={
                      <span>
                        There was an error contacting the server. Please report
                        a bug{' '}
                        <Link
                          href={config['metadata']['link_to_code'] + '/issues'}
                          target="_blank">
                          here
                        </Link>
                        .
                      </span>
                    }
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
                      ...Array(this.state.new_papers.length).keys(),
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

                  {[...Array(this.state.new_papers.length).keys()].map(
                    (item, idx) => {
                      if (
                        idx >= (this.state.pageID - 1) * this.state.pageMAX &&
                        idx < this.state.pageID * this.state.pageMAX
                      ) {
                        return (
                          <Insight
                            key={idx}
                            paper_data={this.state.paper_data}
                            data={this.state.new_papers[idx]}
                          />
                        );
                      } else {
                        return null;
                      }
                    }
                  )}
                </div>
              )}

              <br />
              <br />
            </AccordionItem>
          </Accordion>
        </div>
      </>
    );
  }
}

export { Insights };
