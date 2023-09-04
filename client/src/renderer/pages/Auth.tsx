import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import Container from 'reactstrap/lib/Container';
import Button from 'reactstrap/lib/Button';
import Label from 'reactstrap/lib/Label';
import Input from 'reactstrap/lib/Input';
import FormGroup from 'reactstrap/lib/FormGroup';
import Col from 'reactstrap/lib/Col';
import Row from 'reactstrap/lib/Row';
import Alert from 'reactstrap/lib/Alert';
import { auth } from '../services/firebase';
import { signup } from '../services/api';

const Auth = ({ type }) => {
  const history = useHistory();
  const [viewType, setType] = useState(type || 'signup');
  const [alternateButton, setAlternateButton] = useState({
    label: 'Already have an account?',
    text: 'Sign in',
  });
  const [actionButtonText, setActionButtonText] = useState('Sign Up');

  const [inputValues, setInputValues] = useState({
    email: '',
    password: '',
    role: '',
    name: '',
  });
  const updateInputValue = (e) =>
    setInputValues((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

  const [error, setError] = useState('');

  const changeAuthType = () => {
    if (viewType === 'signin') {
      setType('signup');
      setActionButtonText('Sign Up');
      setAlternateButton({
        label: 'Already have an account?',
        text: 'Sign in',
      });
    } else {
      setType('signin');
      setActionButtonText('Sign in');
      setAlternateButton({
        label: "Don't have an account?",
        text: 'Sign up',
      });
    }
  };

  const signupHandler = async () => {
    if (viewType === 'signup') {
      const errors = [];
      Object.keys(inputValues).forEach((key) => {
        if (!inputValues[key]) errors.push(`${key} is required.`);
      });
      if (errors.length > 0) return setError(`<pre>${errors.join('\n')}</pre>`);
      try {
        const { data } = await signup(inputValues);
        await auth().signInWithCustomToken(data.token);
        history.push('/');
      } catch (e) {
        setError(
          e.response?.data || 'Oops, something went wrong. Please try again'
        );
      }
    } else {
      try {
        await auth().signInWithEmailAndPassword(
          inputValues.email,
          inputValues.password
        );
        history.push('/');
      } catch (e) {
        if (e.code === 'auth/wrong-password')
          return setError('Invalid Password');
        setError(e.message);
      }
    }
  };

  useEffect(() => {
    auth().onAuthStateChanged((auth) => {
      console.log('currently logged in user ', auth);
    });
  }, []);

  return (
    <>
      <Container
        style={{
          zIndex: 1,
          paddingRight: '13%',
          paddingTop: '3%',
          paddingLeft: '14%',
          margin: '0% 20% 20% 20%',
          postition: 'relative',
        }}
        className={'justify-content-center'}
      >
        <img
          width="580"
          src="https://shapeai-uploads.s3.ap-south-1.amazonaws.com/undraw_coworking.svg"
          style={{ position: 'absolute', left: 0, bottom: 0, zIndex: -1 }}
        />
        <img
          width="580"
          src="https://shapeai-uploads.s3.ap-south-1.amazonaws.com/rocket-cartoon.png"
          style={{ position: 'absolute', right: 0, top: 0, zIndex: -1 }}
        />
        <Container
          className="d-flex justify-content-center"
          style={{ marginBottom: '10px' }}
        >
          <img
            width="240"
            src="https://shapeai-uploads.s3.ap-south-1.amazonaws.com/lab-ez-full.png"
          />
        </Container>
        <h4 style={{ color: 'mediumslateblue', fontWeight: 800 }}>
          Welcome {viewType === 'signin' && 'back'} to Lab EZ!
        </h4>
        <Alert isOpen={error} toggle={() => setError('')}>
          {' '}
          <div dangerouslySetInnerHTML={{ __html: error }} />{' '}
        </Alert>
        <div className={'auth-form justify-content-center'}>
          <FormGroup
            style={{ display: viewType === 'signup' ? 'block' : 'none' }}
            row
          >
            <Label for="name" sm={12}>
              Name
            </Label>
            <Col sm={12}>
              <Input
                name="name"
                placeholder="Bhenz"
                onChange={updateInputValue}
              />
            </Col>
          </FormGroup>
          <FormGroup
            style={{ display: viewType === 'signup' ? 'block' : 'none' }}
            row
          >
            <Label md={4}>Role</Label>
            <Col style={{ marginLeft: '20px' }} sm={10}>
              <Col>
                <Label>
                  <Input
                    type="radio"
                    name="role"
                    value="teacher"
                    onChange={updateInputValue}
                  />
                  Teacher
                </Label>
              </Col>
              <Col>
                <Label>
                  <Input
                    type="radio"
                    name="role"
                    value="student"
                    onChange={updateInputValue}
                  />
                  Student
                </Label>
              </Col>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for="email" sm={2}>
              Email
            </Label>
            <Col sm={12}>
              <Input
                type="email"
                name="email"
                onChange={updateInputValue}
                placeholder="you@rock.com"
              />
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label sm={2}>Password</Label>
            <Col sm={12}>
              <Input
                type="password"
                name="password"
                placeholder="super secret"
                onChange={updateInputValue}
              />
            </Col>
          </FormGroup>
          <Button onClick={signupHandler} block color="primary">
            {actionButtonText}
          </Button>
          <Row className={'justify-content-center'} style={{ marginTop: '45px' }}>
            <h3 style={{ fontWeight: '800' }} > {alternateButton.label} </h3> <br />
            <Button
              style={{ marginTop: '10px', padding: '15px' }}
              onClick={changeAuthType}
              block
              color="success"
            >
              {alternateButton.text}
            </Button>
          </Row>
        </div>
      </Container>
    </>
  );
};

export default Auth;
