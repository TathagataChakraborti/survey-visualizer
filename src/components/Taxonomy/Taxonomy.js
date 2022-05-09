import React from 'react';
import '@carbon/charts/styles.css';
import Edge from '@carbon/charts-react/diagrams/Edge';
import CardNode, {
  CardNodeColumn,
  CardNodeTitle,
} from '@carbon/charts-react/diagrams/CardNode';
import {
  TreemapChart,
  CirclePackChart,
  SimpleBarChart,
} from '@carbon/charts-react';
import {
  hashID,
  unhashID,
  getParents,
  getChildren,
  PaperInner,
} from '../../components/Info';
import { buildElbowPathString } from '@carbon/charts/components/diagrams/buildPaths';
import {
  Document32,
  LogoGithub32,
  Add16,
  Subtract16,
  CaretRight32,
  CaretLeft32,
} from '@carbon/icons-react';
import {
  Modal,
  Checkbox,
  Button,
  Link,
  Breadcrumb,
  BreadcrumbItem,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  Tabs,
  Tab,
  Slider,
  Toggle,
  AccordionItem,
  Accordion,
} from 'carbon-components-react';

let config = require('../../config.json');
let view_config = config.views.filter(view => view.name === 'Taxonomy')[0];
let data = require('../../compiler/data/Taxonomy.json');

let fancy_chart_default_level = 2;

class Taxonomy extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      data: data,
      active_tab: view_config['default_tab'],
      taxonomy_data: [],
      paper_data: [],
      taxonomy_data_fancy: [],
      modal: false,
      config: {
        nodeHeight: 50,
        nodeWidth: 200,
        nodeGapHoriontal: 250,
        nodeGapVertical: 100,
        slider: 12,
        vertical_offset: 0,
        plot_options: {
          title: '',
          draw_treemap: true,
          draw_circlemap: true,
          level: fancy_chart_default_level,
          canvasZoom: {
            enabled: true,
          },
          height: '400px',
          width: '100%',
          axis: {
            legend: {
              position: 'TOP',
            },
          },
        },
        modal_timeline: {
          legend: {
            enabled: false,
          },
          grid: {
            x: {
              enabled: false,
            },
            y: {
              enabled: false,
            },
          },
          axes: {
            left: {
              mapsTo: 'year',
              scaleType: 'labels',
            },
            top: {
              mapsTo: 'value',
            },
          },
          height: '1000px',
          width: '90%',
        },
      },
    };
  }

  componentDidMount(props) {
    if (this.ref.current) {
      const container_width = this.ref.current.offsetWidth;

      this.setState(
        {
          ...this.state,
          config: {
            ...this.state.config,
            nodeWidth: container_width / 5,
            nodeGapHoriontal: container_width / 4,
          },
        },
        () => {
          this.switchTabs(this.state.active_tab);
        }
      );
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.props !== prevProps.props)
      this.setState(
        {
          ...this.state,
          paper_data: this.props.props,
          years: this.props.years,
        },
        () => {
          this.tranformData2Tree();
        }
      );
  }

  switchTabs(tab_name) {
    const new_paper_data = data.filter(
      data_item => data_item.name === tab_name
    )[0];

    const tab_config = view_config.tabs.filter(
      tab => tab.tab_name === tab_name
    )[0];

    const new_taxonomoy_data = new_paper_data.taxonomy.map(
      (taxonomy_layer, taxonomy_level) => {
        var new_taxonomoy_layer = [];

        taxonomy_layer.forEach(node => {
          if (!getChildren(node, new_paper_data.taxonomy).length)
            node.expanded = false;

          new_taxonomoy_layer.push(node);
        });

        return new_taxonomoy_layer;
      }
    );

    const fancy_chart_level = tab_config.fancy_chart_default_level
      ? tab_config.fancy_chart_default_level
      : Math.min(fancy_chart_default_level, new_taxonomoy_data.length - 1);

    this.setState(
      {
        ...this.state,
        active_tab: tab_name,
        taxonomy_data: new_taxonomoy_data,
        paper_data: new_paper_data.data,
        config: {
          ...this.state.config,
          vertical_offset: tab_config.taxonomy.columns.start,
          plot_options: {
            ...this.state.config.plot_options,
            level: fancy_chart_level,
          },
        },
      },
      () => {
        this.updateSelectedTab();
        this.tranformData2Tree();
      }
    );
  }

  updateSelectedTab(e) {
    this.props.updateSelectedTab(
      this.state.paper_data,
      this.state.taxonomy_data
    );
  }

  updateSelectedTags(e) {
    this.props.updateSelectedTags(unhashID(e.currentTarget.id));
  }

  onClickExpandNode(selected_node) {
    var change_log = [];
    var new_taxonomoy_data = this.state.taxonomy_data.map(
      (taxonomy_layer, taxonomy_level) =>
        taxonomy_layer.map((node, i) => {
          if (hashID(node) === hashID(selected_node)) {
            node.expanded = !node.expanded;
            change_log.push(node);
          }

          var parent_element = null;
          if (
            taxonomy_level > 0 &&
            taxonomy_level < this.state.taxonomy_data.length - 1
          )
            parent_element = this.state.taxonomy_data[taxonomy_level - 1].find(
              parent_node => parent_node.name === node.parent
            );

          if (parent_element) {
            var reference = change_log.find(
              e => hashID(e) === hashID(parent_element)
            );

            if (reference) {
              node.expanded = reference.expanded;
              change_log.push(node);
            }
          }

          return node;
        })
    );

    this.setState({
      ...this.state,
      taxonomy_data: new_taxonomoy_data,
    });
  }

  onClickModalNode = e => {
    this.setState({
      ...this.state,
      modal: e,
    });
  };

  onClickModalClose = e => {
    this.setState({
      ...this.state,
      modal: false,
    });
  };

  handleSliderChange = e => {
    this.setState({
      ...this.state,
      config: {
        ...this.state.config,
        slider: e.value,
      },
    });
  };

  getPapersWithTag = node => {
    return this.state.paper_data.filter(
      paper =>
        paper.tags
          .map(e => hashID(e))
          .indexOf(hashID(node, this.state.taxonomy_data)) > -1
    );
  };

  tranformData2Tree = e => {
    var draw_circlemap = true;
    var start = this.state.config.plot_options.level;
    var stop = this.state.config.plot_options.level + 1;

    const temp_taxonomy_data = this.state.taxonomy_data.slice(start - 1, stop);
    const new_taxonomoy_data = temp_taxonomy_data[0].map((item, id) => {
      const children = temp_taxonomy_data[1]
        .filter(e => e.parent === item.name)
        .map(e => {
          const num_papers = this.getPapersWithTag(e).length;
          draw_circlemap = draw_circlemap && Boolean(num_papers);

          return {
            name: e.name,
            value: num_papers ? num_papers : 0,
            showLabel: true,
          };
        });
      var new_node = {
        name: item.name,
        children: children,
      };

      return new_node;
    });

    this.setState(
      {
        ...this.state,
        config: {
          ...this.state.config,
          plot_options: {
            ...this.state.config.plot_options,
            draw_treemap: false,
            draw_circlemap: false,
          },
        },
      },
      () => {
        this.setState({
          ...this.state,
          taxonomy_data_fancy: new_taxonomoy_data,
          config: {
            ...this.state.config,
            plot_options: {
              ...this.state.config.plot_options,
              draw_treemap: true,
              draw_circlemap: true,
            },
          },
        });
      }
    );
  };

  getTimeline(e) {
    const current_year = new Date().getFullYear();

    var years = [...Array(current_year + 1 - config.min_year).keys()].map(e => {
      return e + config.min_year;
    });
    var data = {};

    const paper_data = this.state.paper_data.filter(
      paper =>
        paper['tags'].map(e => hashID(e)).indexOf(hashID(this.state.modal)) > -1
    );

    years.forEach(e => {
      data[e] = 0;
    });

    if (paper_data)
      paper_data.forEach(paper => {
        data[parseInt(paper.year)] += 1;
      });

    data = Object.keys(data).map(e => {
      return { year: e, value: data[e] };
    });

    return data;
  }

  renderParents(node) {
    const parents = getParents(node, this.state.taxonomy_data);

    if (!parents.length) return [];

    return (
      <Breadcrumb noTrailingSlash>
        {parents.map((parent_level, level) => {
          return parent_level.map((parent, i) => (
            <BreadcrumbItem
              className="hover-cursor"
              onClick={this.onClickModalNode.bind(this, parent)}
              key={i}>
              {parent.name}
            </BreadcrumbItem>
          ));
        })}
        <BreadcrumbItem isCurrentPage>{node.name}</BreadcrumbItem>
      </Breadcrumb>
    );
  }

  toggleLevel(level, status) {
    const new_taxonomoy_data = this.state.taxonomy_data.map(
      (taxonomy_layer, taxonomy_level) => {
        var new_taxonomy_layer = taxonomy_layer;

        if (
          taxonomy_level >= level &&
          taxonomy_level < this.state.taxonomy_data.length - 1
        )
          new_taxonomy_layer = taxonomy_layer.map(e => {
            e.expanded = status;
            return e;
          });

        return new_taxonomy_layer;
      }
    );

    this.setState({
      ...this.state,
      taxonomy_data: new_taxonomoy_data,
    });
  }

  determineExpandButton = node_status => {
    if (node_status) {
      return Subtract16;
    } else {
      return Add16;
    }
  };

  onClimb = e => {
    var new_level = this.state.config.plot_options.level;
    var delta = e.currentTarget.name === 'climb-up' ? 1 : -1;

    new_level = new_level + delta;
    new_level = Math.min(this.state.taxonomy_data.length - 1, new_level);
    new_level = Math.max(1, new_level);

    this.setState(
      {
        ...this.state,
        config: {
          ...this.state.config,
          plot_options: {
            ...this.state.config.plot_options,
            level: new_level,
          },
        },
      },
      () => {
        this.tranformData2Tree();
      }
    );
  };

  render() {
    var depth_hashes = {};
    const nodes = this.state.taxonomy_data.map(
      (taxonomy_layer, taxonomy_level) => {
        var current_level = 0;

        return taxonomy_layer.map((node, i) => {
          var parent_element = null;

          if (taxonomy_level > 0)
            parent_element = this.state.taxonomy_data[taxonomy_level - 1].find(
              parent_node => parent_node.name === node.parent
            );

          if (!parent_element || parent_element.expanded) {
            var cache_taxonomy_level = taxonomy_level + 1;
            var cache_parents = taxonomy_layer
              .filter((node, index) => index < i)
              .filter(e => e.expanded);
            var cache_nodes = taxonomy_layer
              .filter((node, index) => index < i)
              .filter(e => !e.expanded);

            var temp_y = 0;

            if (cache_parents.length === 0 && node.parent) {
              const parents = getParents(node, this.state.taxonomy_data);
              const parent = parents[parents.length - 1][0];

              temp_y =
                depth_hashes[hashID(parent)].temp_y +
                taxonomy_layer
                  .filter(e => e.parent === parent.name)
                  .indexOf(node);
            } else {
              while (cache_taxonomy_level < this.state.taxonomy_data.length) {
                var new_parents = [];
                var new_taxonomy_layer = this.state.taxonomy_data[
                  cache_taxonomy_level
                ].filter(node =>
                  new Set(cache_parents.map(p => p.name)).has(node.parent)
                );

                new_taxonomy_layer.forEach(parent => {
                  if (!parent.expanded) {
                    cache_nodes.push(parent);
                  } else {
                    new_parents.push(parent);
                  }
                });

                cache_parents = new_parents;
                cache_taxonomy_level++;
              }

              temp_y = cache_nodes.length;
            }

            if (current_level && temp_y === current_level)
              temp_y = temp_y + taxonomy_layer.indexOf(node);

            current_level = temp_y;

            var x = (node.level - 1) * this.state.config.nodeGapHoriontal;
            var y = (temp_y + 0.5) * this.state.config.nodeGapVertical;

            depth_hashes[hashID(node)] = {
              temp_y: temp_y,
              y: y,
            };

            return (
              <foreignObject
                style={{ overflow: 'visible' }}
                key={`node_${i}`}
                transform={`translate(${x}, ${y})`}
                height={this.state.config.nodeHeight}
                width={this.state.config.nodeWidth}>
                <>
                  <CardNode onClick={this.onClickModalNode.bind(this, node)}>
                    <CardNodeColumn>
                      <CardNodeTitle className="text-overflow">
                        {node.name}
                      </CardNodeTitle>
                    </CardNodeColumn>
                  </CardNode>
                  {getChildren(node, this.state.taxonomy_data).length > 0 && (
                    <Button
                      onClick={this.onClickExpandNode.bind(this, node)}
                      kind="ghost"
                      className="expand-button"
                      renderIcon={this.determineExpandButton(node.expanded)}
                      iconDescription="Expand"
                      hasIconOnly
                    />
                  )}
                  <Checkbox
                    labelText={
                      <span className="text-blue">
                        {this.getPapersWithTag(node).length}
                      </span>
                    }
                    id={hashID(node, this.state.taxonomy_data)}
                    onClick={this.updateSelectedTags.bind(this)}
                  />
                </>
              </foreignObject>
            );
          } else {
            return <span key={i}></span>;
          }
        });
      }
    );

    const edges = this.state.taxonomy_data
      .filter((taxonomy_layer, taxonomy_level) => taxonomy_level > 0)
      .map((taxonomy_layer, taxonomy_level) =>
        taxonomy_layer.map((node, i) => {
          var source_x = 0;
          var source_y = 0;

          const parent_element = this.state.taxonomy_data[taxonomy_level].find(
            parent_node => parent_node.name === node.parent
          );

          if (parent_element && parent_element.expanded) {
            source_x =
              (parent_element.level - 1) * this.state.config.nodeGapHoriontal;
            source_y = depth_hashes[hashID(parent_element)].y;

            const source = {
              x: source_x - 1 + this.state.config.nodeWidth / 2,
              y: source_y + this.state.config.nodeHeight / 2,
            };

            const target = {
              x: (node.level - 1) * this.state.config.nodeGapHoriontal,
              y:
                depth_hashes[hashID(node)].y + this.state.config.nodeHeight / 2,
            };

            return (
              <Edge
                key={`link_${i}`}
                source={source}
                target={target}
                path={buildElbowPathString(source, target)}
                variant="dash-md"
              />
            );
          } else {
            return <span key={i}></span>;
          }
        })
      );

    const buttons = this.state.taxonomy_data
      .filter(
        (taxonomy_layer, taxonomy_level) =>
          taxonomy_level < this.state.taxonomy_data.length - 1
      )
      .map((taxonomy_layer, taxonomy_level) => {
        const x = taxonomy_level * this.state.config.nodeGapHoriontal;
        const y = 0;

        var draw = true;

        if (taxonomy_level > 0)
          draw = this.state.taxonomy_data[taxonomy_level - 1].reduce(
            (any_enabled, node) => {
              any_enabled = any_enabled || node.expanded;
              return any_enabled;
            },
            false
          );

        if (draw) {
          return (
            <foreignObject
              style={{ overflow: 'visible' }}
              key={taxonomy_level}
              transform={`translate(${x}, ${y})`}
              height={this.state.config.nodeHeight}
              width={this.state.config.nodeWidth}>
              <Toggle
                key={taxonomy_level}
                labelA="Expand"
                labelB="Collapse"
                onToggle={this.toggleLevel.bind(this, taxonomy_level)}
                size="sm"
                aria-label="expand or collapse level"
                defaultToggled
                id={taxonomy_level.toString()}
              />
            </foreignObject>
          );
        } else {
          return <span key={taxonomy_level}></span>;
        }
      });

    const taxonomy_area = view_config.tabs.map((tab, id) => (
      <div className="tab-content">
        {tab.title_text && (
          <>
            <h6>{tab.title_text}</h6>
            <br />
          </>
        )}
        {tab.tab_name === this.state.active_tab && (
          <div>
            <Accordion align="start">
              {tab.fancy_chart && (
                <AccordionItem
                  title="Treemap View"
                  className="full-accordion"
                  open>
                  <div className="bx--container">
                    <div className="bx--row">
                      <div style={{ borderRight: '1pt solid silver' }}>
                        <h6>Relative Zoom</h6>

                        <Slider
                          hideTextInput
                          id="slider"
                          max={16}
                          min={0}
                          step={1}
                          onChange={this.handleSliderChange.bind(this)}
                          value={this.state.config.slider}
                        />
                      </div>

                      <div style={{ marginLeft: '10px' }}>
                        <div>
                          <h6 style={{ marginBottom: '5px' }}>
                            Climb Hierarchy
                          </h6>

                          <Button
                            onClick={this.onClimb.bind(this)}
                            name="climb-down"
                            kind="ghost"
                            className="navigation-buttons"
                            renderIcon={CaretLeft32}
                            iconDescription="Navigate Up"
                            size="sm"
                            disabled={
                              this.state.config.plot_options.level === 1
                            }
                            hasIconOnly
                          />
                          <Button
                            onClick={this.onClimb.bind(this)}
                            name="climb-up"
                            kind="ghost"
                            className="navigation-buttons"
                            renderIcon={CaretRight32}
                            iconDescription="Navigate Down"
                            size="sm"
                            disabled={
                              this.state.config.plot_options.level ===
                              this.state.taxonomy_data.length - 1
                            }
                            hasIconOnly
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bx--row">
                      <div className={'bx--col-lg-' + this.state.config.slider}>
                        {this.state.config.plot_options.draw_treemap && (
                          <TreemapChart
                            data={this.state.taxonomy_data_fancy}
                            options={
                              this.state.config.plot_options
                            }></TreemapChart>
                        )}
                      </div>

                      <div
                        className={
                          'bx--col-lg-' +
                          (16 - this.state.config.slider).toString()
                        }>
                        {this.state.config.plot_options.draw_circlemap && (
                          <CirclePackChart
                            data={this.state.taxonomy_data_fancy}
                            options={this.state.config.plot_options}>
                            >
                          </CirclePackChart>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionItem>
              )}

              <AccordionItem
                title="Hierarchy View"
                className="full-accordion"
                open>
                <div ref={this.ref}>
                  <svg height="10000px" width="100%">
                    {buttons}
                    {edges}
                    {nodes}
                  </svg>
                </div>
              </AccordionItem>
            </Accordion>

            <Modal
              modalHeading={this.renderParents(this.state.modal)}
              modalLabel="Taxonomy View of VAM-HRI Interation Design Elements"
              passiveModal
              hasScrollingContent
              open={Boolean(this.state.modal)}
              onRequestClose={this.onClickModalClose.bind(this)}
              size="lg"
              aria-label=""
              style={{ height: '100%' }}>
              <div className="bx--container">
                <div className="bx--row">
                  <div className="bx--col-lg-10">
                    {this.state.modal && (
                      <>
                        <h4>
                          <span style={{ color: 'gray' }}>Category: </span>{' '}
                          {this.state.modal.name}
                        </h4>
                        <hr />
                        {this.state.modal.abstract && (
                          <>
                            <p>{this.state.modal.abstract}</p>
                            <br />
                            <br />
                          </>
                        )}
                      </>
                    )}

                    {getChildren(this.state.modal, this.state.taxonomy_data)
                      .length > 0 && (
                      <>
                        Children:{' '}
                        {getChildren(
                          this.state.modal,
                          this.state.taxonomy_data
                        ).map((child, i) => (
                          <span key={i}>
                            {i > 0 && ' | '}
                            <Link
                              onClick={this.onClickModalNode.bind(this, child)}>
                              {child.name}
                            </Link>
                          </span>
                        ))}
                      </>
                    )}

                    <br />
                    <br />

                    <Button
                      style={{ marginRight: '10px' }}
                      kind="primary"
                      size="field"
                      renderIcon={Document32}
                      iconDescription="Add"
                      href={config['metadata']['primary_link']}
                      target="_blank">
                      Read More
                    </Button>

                    <Button
                      kind="tertiary"
                      renderIcon={LogoGithub32}
                      size="field"
                      href={config['metadata']['link_to_contribute']}
                      target="_blank">
                      Contribute
                    </Button>
                    <br />
                    <br />

                    <StructuredListWrapper>
                      <StructuredListHead>
                        <StructuredListRow>
                          <StructuredListCell head>
                            Papers in this Category
                          </StructuredListCell>
                        </StructuredListRow>
                      </StructuredListHead>
                      <StructuredListBody>
                        {this.state.paper_data
                          .filter(
                            paper =>
                              paper['tags']
                                .map(e => hashID(e))
                                .indexOf(hashID(this.state.modal)) > -1
                          )
                          .map(item => (
                            <StructuredListRow key={item.UID}>
                              <StructuredListCell>
                                <PaperInner paper={item} />
                              </StructuredListCell>
                              <StructuredListCell></StructuredListCell>
                            </StructuredListRow>
                          ))}
                      </StructuredListBody>
                    </StructuredListWrapper>
                  </div>
                  <div className="bx--col-lg-6">
                    {this.state.modal && (
                      <SimpleBarChart
                        data={this.getTimeline()}
                        options={
                          this.state.config.modal_timeline
                        }></SimpleBarChart>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>
    ));

    return (
      <div>
        {view_config.tabs.length === 1 && <>{taxonomy_area[0]}</>}

        {view_config.tabs.length > 1 && (
          <Tabs
            scrollIntoView={false}
            selected={view_config.tabs
              .map(tab => view_config.default_tab === tab.tab_name)
              .indexOf(true)}>
            {view_config.tabs.map((tab, id) => (
              <Tab
                key={id}
                id={tab.tab_name}
                label={tab.tab_name}
                disabled={tab.disabled}
                onClick={this.switchTabs.bind(this, tab.tab_name)}>
                {taxonomy_area[id]}
              </Tab>
            ))}
          </Tabs>
        )}
      </div>
    );
  }
}

export { Taxonomy };
