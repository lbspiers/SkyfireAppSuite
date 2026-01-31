import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Container, Col, Form, FormFeedback, Input, Label, Button } from 'reactstrap';
import logger from '../services/devLogger';

const CreateTicket = () => {
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: '',
      description: '',
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Please Enter Title'),
      description: Yup.string().required('Please Enter Description'),
    }),
    onSubmit: (values) => {
      logger.log('General', 'Ticket values:', values);
    },
  });

  return (
    <div className="page-content">
      <div className="create-ticket-wrapper">
        <Container className="overflow-auto h-100 p-4">
          <Col lg={12}>
            <h4 className="mb-5">Submit a Support Ticket</h4>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
              }}
              action="#"
            >
              {/* Title */}
              <div className="mb-3">
                <Label>Title</Label>
                <Input
                  type="text"
                  className="form-control"
                  id="title"
                  name="title"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.title || ''}
                  invalid={
                    validation.touched.title && validation.errors.title ? true : false
                  }
                />
                {validation.touched.title && validation.errors.title ? (
                  <FormFeedback type="invalid">
                    {validation.errors.title}
                  </FormFeedback>
                ) : null}
              </div>

              {/* Description */}
              <div className="mb-3">
                <Label>Description of Problem* (Max 250 Characters)</Label>
                <Input
                  type="textarea"
                  rows={10}
                  className="form-control"
                  id="description"
                  name="description"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.description || ''}
                  invalid={
                    validation.touched.description && validation.errors.description
                      ? true
                      : false
                  }
                />
                {validation.touched.description && validation.errors.description ? (
                  <FormFeedback type="invalid">
                    {validation.errors.description}
                  </FormFeedback>
                ) : null}
              </div>

              <p className="field-description">
                Please be as descriptive as you can. Include any error message if
                applicable.
              </p>
              <p className="field-description">
                You typically can copy the text from an error message and paste it here in
                the description of problem.
              </p>

              {/* Submit Button */}
              <div className="d-flex justify-content-start mt-5">
                <Button color="success" className="submit-btn" type="submit">
                  Submit
                </Button>
              </div>
            </Form>
          </Col>
        </Container>
      </div>
    </div>
  );
};

export default CreateTicket;
