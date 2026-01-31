import React from 'react';
import { useFormik } from 'formik';
import { Container, Row, Col, Form, Label } from 'reactstrap';
import logger from '../services/devLogger';

const PreferredEquipment = () => {
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
      logger.log('Equipment', 'Preferred Equipment:', values);
    },
  });

  return (
    <div className="page-content">
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
                <Label htmlFor="category" className="form-label d-block">
                  Category
                </Label>
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
                <Label htmlFor="status" className="form-label d-block">
                  Status
                </Label>
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
                <Label htmlFor="companyName" className="form-label d-block">
                  Company Name
                </Label>
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
      {/* Equipment list would be rendered here */}
      <div>{/* Equipment table/grid component */}</div>
    </div>
  );
};

export default PreferredEquipment;
