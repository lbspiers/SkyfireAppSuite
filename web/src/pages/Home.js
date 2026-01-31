import React, { useState } from 'react';
import { Container, Row, Col, Form, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import logger from '../services/devLogger';

// Project Form Component
const ProjectForm = () => {
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      installer: '',
      installerProjectId: '',
      customerFirstName: '',
      customerLastName: '',
      projectNotes: '',
      siteSurveyScheduledDate: '',
      additionalServices: [],
      documents: [],
      siteSurveyPhotos: [],
    },
    onSubmit: (values) => {
      logger.log('General', 'Project submitted:', values);
    },
  });

  return (
    <Container className="filter-wrapper">
      <Row>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            validation.handleSubmit();
            return false;
          }}
          className="needs-validation"
        >
          <Row>
            <Col md={3}>
              <label htmlFor="category" className="form-label d-block">
                Category
              </label>
              <select
                className="form-select"
                id="category"
                value={validation.values.category || ''}
                name="category"
                onChange={validation.handleChange}
              >
                <option defaultValue="">Choose...</option>
                <option>California</option>
              </select>
            </Col>
            <Col md={3}>
              <label htmlFor="status" className="form-label d-block">
                Status
              </label>
              <select
                className="form-select"
                id="eqStatus"
                value={validation.values.eqStatus || ''}
                name="eqStatus"
                onChange={validation.handleChange}
              >
                <option defaultValue="">Choose...</option>
                <option>California</option>
              </select>
            </Col>
            <Col md={3}>
              <label htmlFor="companyName" className="form-label d-block">
                Company Name
              </label>
              <select
                className="form-select"
                id="companyName"
                value={validation.values.companyName || ''}
                name="companyName"
                onChange={validation.handleChange}
              >
                <option defaultValue="">Choose...</option>
                <option>California</option>
              </select>
            </Col>
          </Row>
        </Form>
      </Row>
    </Container>
  );
};

// Main Home Page Component
const Home = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [passedSteps, setPassedSteps] = useState([1]);

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      const modifiedSteps = [...passedSteps, tab];
      setActiveTab(tab);
      setPassedSteps(modifiedSteps);
    }
  };

  return (
    <div className="page-content">
      <Container fluid className="home-page-wrapper">
        <Row>
          <Col xl={12}>
            <Form className="form-steps">
              <div className="text-center pt-3 pb-4 mb-1"></div>

              {/* Navigation Tabs */}
              <div className="mb-4">
                <Nav pills className="nav-pills nav custom-nav nav-justified" role="tablist">
                  <NavItem>
                    <NavLink
                      href="#"
                      id="steparrow-gen-info-tab"
                      className={classnames({ active: activeTab === 1 })}
                      onClick={() => {
                        toggleTab(1);
                      }}
                    >
                      Solar New Project
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      href="#"
                      id="steparrow-gen-info-tab"
                      className={classnames({ active: activeTab === 2 })}
                      onClick={() => {
                        toggleTab(2);
                      }}
                    >
                      EV New Project
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      href="#"
                      id="steparrow-gen-info-tab"
                      className={classnames({ active: activeTab === 3 })}
                      onClick={() => {
                        toggleTab(3);
                      }}
                    >
                      Existing Projects
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      href="#"
                      id="steparrow-gen-info-tab"
                      className={classnames({ active: activeTab === 4 })}
                      onClick={() => {
                        toggleTab(4);
                      }}
                    >
                      Preferred Equipment
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      href="#"
                      id="steparrow-gen-info-tab"
                      className={classnames({ active: activeTab === 5 })}
                      onClick={() => {
                        toggleTab(5);
                      }}
                    >
                      Manual Upload
                    </NavLink>
                  </NavItem>
                </Nav>
              </div>

              {/* Tab Content */}
              <TabContent activeTab={activeTab}>
                <TabPane id="steparrow-gen-info" tabId={1}>
                  <ProjectForm />
                </TabPane>
                <TabPane id="steparrow-description-info" tabId={2}>
                  <ProjectForm />
                </TabPane>
                <TabPane id="pills-experience" tabId={3}>
                  <ProjectForm />
                </TabPane>
                <TabPane id="pills-experience" tabId={4}>
                  <ProjectForm />
                </TabPane>
                <TabPane id="pills-experience" tabId={5}>
                  <ProjectForm />
                </TabPane>
              </TabContent>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;
