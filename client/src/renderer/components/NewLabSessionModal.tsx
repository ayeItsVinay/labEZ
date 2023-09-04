import React,  { useState } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Card, CardTitle, CardBody } from 'reactstrap';
import NammaInput from './NammaInput';

const NewLabSessionModal = ({ isOpen, toggle, onSubmit }: { isOpen: boolean, toggle: () => void, onSubmit: () => void }) => {

  const [statementsCount, setStatementsCount] = useState(1);
  const [problemStatements, setProblemStatements] = useState({});
  const [inputValues, setInputValues] = useState({ name: '', executionEnvironment: 'javascript' });

  const submitHandler = () => {
    const data = {
      problemStatements: Object.values(problemStatements).filter(ps => ps.title && ps.description),
      ...inputValues,
    };
    setInputValues({ name: '', executionEnvironment: 'javascript' });
    setProblemStatements({ 0: { title: '', description: '' } });
    setStatementsCount(1);
    onSubmit(data);
  };

  const updateProblemStatements = (e: any, i: number) =>
    setProblemStatements({
      ...problemStatements,
      [i]: {
        // @ts-ignore
        ...problemStatements[i],
        [e.target.name]: e.target.value,
      },
    });

  const updateInputValues = (e) => {
    setInputValues({
      ...inputValues,
      [e.target.name]: e.target.value,
    });
  }

  // @ts-ignore
  return (
    <>
      <Modal size={'lg'} isOpen={isOpen}>
        <ModalHeader>Create New Lab Session</ModalHeader>
        <ModalBody>

          <NammaInput
            onChange={updateInputValues}
            type={'text'}
            label={'Name'}
            value={inputValues.name}
          />

          <NammaInput
            onChange={updateInputValues}
            type={'select'}
            label={'Execution Environment'}
            value={inputValues.executionEnvironment}
            options={[
              { label: 'JavaScript', value: 'js' },
              { label: 'C ++', value: 'cpp' },
              { label: 'C', value: 'c' },
              { label: 'Java', value: 'java' },
            ]}
          />
          <h3>Problem Statements</h3>

          {[...Array(statementsCount).keys()].map((i) => (
            <Card key={i} style={{ marginBottom: '20px' }}>
              <CardTitle>
                Problem {i + 1}
              </CardTitle>
              <NammaInput
                key={`${i}-title`}
                onChange={(e) => updateProblemStatements(e, i)}
                type="text"
                label={'Title'}
                // @ts-ignore
                value={problemStatements[i]?.title}
              />

              <NammaInput
                key={`${i}-description`}
                onChange={(e) => updateProblemStatements(e, i)}
                type="textarea"
                label="Description"
                // @ts-ignore
                value={problemStatements[i]?.description}
              />
            </Card>
          ))}
          <Button
            onClick={() => setStatementsCount((prev) => (prev += 1))}
            color={'primary'}
          >
            Add +
          </Button>


        </ModalBody>
        <Button color={'success'} block onClick={submitHandler}>
          Create Session
        </Button>
        <Button color={'warning'} block onClick={toggle}>
          Close
        </Button>
      </Modal>
    </>
  );
};

export default NewLabSessionModal;
