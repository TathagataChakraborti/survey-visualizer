import React from 'react';
import GitHubButton from 'react-github-btn';
import { isMobile } from 'react-device-detect';
import {
  Document32,
  LogoGithub32,
  LogoSlack32,
  Add32,
} from '@carbon/icons-react';
import { BasicElement } from '../../components/BasicElement';
import {
  Button,
  ButtonSet,
  ContentSwitcher,
  Switch,
  CodeSnippet,
  Link,
  ToastNotification,
  Tile,
  Accordion,
  AccordionItem,
} from 'carbon-components-react';

let config = require('../../config.json');

class LandingPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: config['default_view'],
    };
  }

  logChange = e => {
    this.setState({
      view: e.name,
    });
  };

  render() {
    return (
      <>
        <div
          className="bx--grid bx--grid--full-width"
          style={{
            width: '100%',
            minHeight: '100vh',
          }}>
          <div className="bx--row">
            <div className="bx--col-lg-4 sidebar">
              <div className="bx--container">
                <ContentSwitcher
                  onChange={e => this.logChange(e)}
                  size="sm"
                  selectedIndex={config['views']
                    .map(e => e.name)
                    .indexOf(this.state.view)}>
                  {config['views'].map((view, id) => (
                    <Switch key={id} name={view['name']} text={view['name']} />
                  ))}
                </ContentSwitcher>

                <br />
                <br />

                <h3>{config['metadata']['title_text']}</h3>

                <br />
                <CodeSnippet type="multi">
                  {config['metadata']['citation_text']}
                </CodeSnippet>

                <br />

                {config['metadata']['info_tile'] && (
                  <Tile>
                    <p style={{ fontSize: 'small' }}>
                      {config['metadata']['info_text']}
                    </p>

                    <div style={{ paddingTop: '3px' }}>
                      {config['metadata']['info_link'].map((link, id) => (
                        <span key={id}>
                          {' '}
                          {id > 0 && '|'}{' '}
                          <Link href={link.link} target="_blank">
                            {link.text}
                          </Link>
                        </span>
                      ))}
                    </div>
                  </Tile>
                )}

                <br />

                <ButtonSet stacked>
                  <Button
                    kind="primary"
                    className="buttonset"
                    size="field"
                    renderIcon={Document32}
                    href={config['metadata']['primary_link']}
                    target="_blank">
                    Read
                  </Button>
                  <br />
                  {config['metadata']['secondary_links'].length === 1 && (
                    <>
                      <Button
                        kind="tertiary"
                        className="buttonset"
                        size="small"
                        renderIcon={Document32}
                        href={config['metadata']['secondary_links'][0]['link']}
                        target="_blank">
                        See Also
                      </Button>
                      <br />
                    </>
                  )}
                  <Button
                    kind="tertiary"
                    className="buttonset tertiary-secondary"
                    renderIcon={LogoGithub32}
                    size="small"
                    href={config['metadata']['link_to_contribute']}
                    target="_blank">
                    Contribute
                  </Button>
                  <br />
                  {config['metadata']['community_link'] && (
                    <>
                      <Button
                        kind="tertiary"
                        className="buttonset tertiary-danger"
                        renderIcon={LogoSlack32}
                        size="small"
                        href={config['metadata']['community_link']}
                        target="_blank">
                        Community
                      </Button>
                      <br />
                    </>
                  )}
                  {config['metadata']['secondary_links'].length > 1 && (
                    <div
                      className="bx--col-lg-8"
                      style={{ padding: 0, margin: 0, maxWidth: '12.25rem' }}>
                      <Accordion align="start">
                        <AccordionItem
                          className="see-also-accordion"
                          title="See also"
                          onClick={e => {
                            window.scrollTo({
                              top:
                                e.currentTarget.offsetHeight > e.pageY / 4
                                  ? 0
                                  : e.pageY / 2,
                              behavior: 'smooth',
                            });
                          }}>
                          <ButtonSet stacked>
                            <br />
                            <br />
                            {config['metadata']['secondary_links'].map(
                              (item, i) => (
                                <div key={i}>
                                  <Button
                                    target="_blank"
                                    href={item.link}
                                    kind="ghost"
                                    renderIcon={Add32}>
                                    {item.name}
                                  </Button>
                                  <br />
                                  <br />
                                </div>
                              )
                            )}
                          </ButtonSet>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </ButtonSet>
              </div>

              {!isMobile && (
                <div
                  className="footer bx--col-lg-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    zIndex: '999',
                  }}>
                  <div className="bx--row">
                    <div className="bx--col-lg-16">
                      <div className="bx--container">
                        <p
                          style={{
                            fontSize: 'small',
                            marginBottom: '10px',
                            maxWidth: '75%',
                          }}>
                          Follow us on GitHub. Your love
                          <br /> keeps us going!{' '}
                          <span role="img" aria-label="hugging face">
                            &#129303;
                          </span>
                        </p>

                        <GitHubButton
                          href={config['metadata']['link_to_code']}
                          data-size="small"
                          data-show-count="true"
                          aria-label="Star survey-visualizer on GitHub">
                          Star
                        </GitHubButton>
                      </div>

                      <div className="bx--container">
                        App built by{' '}
                        <Link
                          href="https://twitter.com/tchakra2"
                          target="_blank">
                          tchakra2
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bx--col-lg-12">
              {isMobile ? (
                <div className="bx--container">
                  <ToastNotification
                    lowContrast
                    hideCloseButton
                    type="error"
                    subtitle={
                      <span>This application only runs on a desktop.</span>
                    }
                    title="Please switch to widescreen."
                  />
                </div>
              ) : (
                <BasicElement
                  props={this.state.view}
                  logChange={this.logChange.bind(this)}
                />
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default LandingPage;
