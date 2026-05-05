import { useState } from 'react';
import type { FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '../../shared/ui/Button/Button';
import { Input } from '../../shared/ui/Input/Input';

export function ContentRequestForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log({ title, description, file });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        label="Название"
        placeholder="Короткое название публикации"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />

      <Field>
        <Label>Описание</Label>
        <Textarea
          placeholder="Опиши контент, который хочешь предложить"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
        />
      </Field>

      <Input
        label="Фото или видео"
        type="file"
        accept="image/*,video/*"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        required
      />

      <Button type="submit">Отправить заявку</Button>
    </Form>
  );
}

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  font-weight: 700;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  outline: none;
  resize: vertical;
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.text};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryHover};
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.16);
  }
`;
