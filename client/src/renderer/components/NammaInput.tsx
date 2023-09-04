import FormGroup from 'reactstrap/lib/FormGroup';
import Label from 'reactstrap/lib/Label';
import Col from 'reactstrap/lib/Col';
import Input from 'reactstrap/lib/Input';
import React from 'react';

interface Option {
  value: string;
  label: string;
}

const camelize = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => chr.toUpperCase());

const NammaInput = ({
  onChange,
  type,
  options,
  label,
  value,
}: {
  onChange: (e: any) => void;
  type: string;
  label: string;
  value: string;
  options?: Option[];
}) => {
  const props = {
    onChange,
    type,
    name: camelize(label),
    placeholder: label,
    value,
    options,
  };
  // @ts-ignore
  return (
    <FormGroup row>
      <Label for={label.toLowerCase()} sm={12}>
        {label[0].toUpperCase()}
        {label.slice(1)}
      </Label>
      <Col sm={12}>
        {type === 'select' ? (
          <Input
            // @ts-ignore
            {...props}
          >
            {options &&
              options.length &&
              options.length > 0 &&
              options.map((option, i) => (
                <option defaultChecked={i === 0} value={option.value}>
                  {' '}
                  {option.label}{' '}
                </option>
              ))}
          </Input>
        ) : (
          <Input
            // @ts-ignore
            {...props}
          />
        )}
      </Col>
    </FormGroup>
  );
};

export default NammaInput;
