/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { FieldProps } from '@atlaskit/form';
import { Meta } from '@atlaskit/form/dist/types/Field';

interface FormChildrenProps {
  ref: React.RefObject<HTMLFormElement>;
  onSubmit: (event?: React.FormEvent<HTMLFormElement> | React.SyntheticEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}

export interface FormChildrenArguments<FormData> {
  formProps: FormChildrenProps;
  disabled: boolean;
  dirty: boolean;
  submitting: boolean;
  getValues: () => FormData;
  setFieldValue: (name: string, value: any) => void;
  reset: (initialValues?: FormData) => void;
}

declare type SupportedElements = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface FieldChildrenArguments<
  FieldValue,
  Element extends SupportedElements = HTMLInputElement
> {
  fieldProps: FieldProps<FieldValue, Element>;
  error?: string;
  valid: boolean;
  meta: Meta;
}
