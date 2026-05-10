import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
    FiAlertCircle,
    FiCheckCircle,
    FiFile,
    FiGlobe,
    FiImage,
    FiSend,
    FiStar,
    FiTrash2,
    FiUploadCloud,
    FiVideo,
} from 'react-icons/fi';

import type { RootState } from '../app/store';
import type {
    MediaType,
    PostVisibility,
} from '../entities/post/model/postTypes';
import { useCreateContentRequestMutation } from '../entities/content-request/api/contentRequestApi';

type FormStatus = 'idle' | 'success' | 'error';

interface SelectedFileState {
    file: File;
    mediaType: MediaType;
    previewUrl: string | null;
}

export function ContentRequestPage() {
    const user = useSelector((state: RootState) => state.auth.user);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [createContentRequest, { isLoading: isSubmitting }] =
        useCreateContentRequestMutation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [suggestedVisibility, setSuggestedVisibility] =
        useState<PostVisibility>('PUBLIC');
    const [selectedFile, setSelectedFile] = useState<SelectedFileState | null>(
        null
    );
    const [status, setStatus] = useState<FormStatus>('idle');
    const [message, setMessage] = useState('');

    const canSubmit = useMemo(() => {
        return (
            Boolean(user) &&
            title.trim().length >= 3 &&
            Boolean(selectedFile) &&
            !isSubmitting
        );
    }, [isSubmitting, selectedFile, title, user]);

    const handlePickFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        setStatus('idle');
        setMessage('');

        if (!file) {
            return;
        }

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            setSelectedFile(null);
            setStatus('error');
            setMessage('Можно отправить только изображение или видео.');
            return;
        }

        const maxSizeMb = isImage ? 8 : 40;
        const maxSizeBytes = maxSizeMb * 1024 * 1024;

        if (file.size > maxSizeBytes) {
            setSelectedFile(null);
            setStatus('error');
            setMessage(
                isImage
                    ? 'Изображение не должно быть больше 8 MB.'
                    : 'Видео не должно быть больше 40 MB.'
            );
            return;
        }

        const mediaType: MediaType = isImage ? 'IMAGE' : 'VIDEO';

        if (isImage) {
            const reader = new FileReader();

            reader.onload = () => {
                setSelectedFile({
                    file,
                    mediaType,
                    previewUrl: typeof reader.result === 'string' ? reader.result : null,
                });
            };

            reader.onerror = () => {
                setSelectedFile(null);
                setStatus('error');
                setMessage('Не удалось прочитать изображение.');
            };

            reader.readAsDataURL(file);
            return;
        }

        setSelectedFile({
            file,
            mediaType,
            previewUrl: null,
        });
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSuggestedVisibility('PUBLIC');
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setStatus('idle');
        setMessage('');

        if (!user) {
            setStatus('error');
            setMessage('Чтобы отправить заявку, нужно войти в аккаунт.');
            return;
        }

        if (title.trim().length < 3) {
            setStatus('error');
            setMessage('Название должно содержать минимум 3 символа.');
            return;
        }

        if (!selectedFile) {
            setStatus('error');
            setMessage('Выберите фото или видео для публикации.');
            return;
        }

        try {
            await createContentRequest({
                title: title.trim(),
                description: description.trim() || '',
                suggestedVisibility,
                file: selectedFile.file,
            }).unwrap();

            setStatus('success');
            setMessage('Заявка отправлена админу. После проверки вы получите уведомление.');
            resetForm();
        } catch (error) {
            setStatus('error');
            setMessage(getErrorMessage(error, 'Не удалось отправить заявку.'));
        }
    };

    return (
        <Page>
            <Grid>
                <FormCard onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Input
                            value={title}
                            maxLength={90}
                            placeholder="Название..."
                            onChange={(event) => setTitle(event.target.value)}
                        />

                        <Hint>{title.trim().length}/90 символов</Hint>
                    </FieldGroup>

                    <FieldGroup>
                        <Textarea
                            value={description}
                            maxLength={900}
                            placeholder="Описание..."
                            onChange={(event) => setDescription(event.target.value)}
                        />

                        <Hint>{description.trim().length}/900 символов</Hint>
                    </FieldGroup>

                    <FieldGroup>
                        <Label>Куда предложить публикацию</Label>

                        <VisibilityGrid>
                            <VisibilityButton
                                type="button"
                                $active={suggestedVisibility === 'PUBLIC'}
                                onClick={() => setSuggestedVisibility('PUBLIC')}
                            >
                                <FiGlobe />

                                <span>
                  <strong>Лента</strong>
                  <small>Пост увидят все пользователи</small>
                </span>
                            </VisibilityButton>

                            <VisibilityButton
                                type="button"
                                $active={suggestedVisibility === 'PREMIUM'}
                                onClick={() => setSuggestedVisibility('PREMIUM')}
                            >
                                <FiStar />

                                <span>
                  <strong>Premium</strong>
                  <small>Пост увидят только подписчики</small>
                </span>
                            </VisibilityButton>
                        </VisibilityGrid>
                    </FieldGroup>

                    <FieldGroup>
                        <Label>Фото или видео</Label>

                        <HiddenFileInput
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />

                        {!selectedFile ? (
                            <UploadZone type="button" onClick={handlePickFile}>
                                <FiUploadCloud />

                                <strong>Выберите файл</strong>

                                <span>Фото до 8 MB или видео до 40 MB.</span>
                            </UploadZone>
                        ) : (
                            <SelectedFile>
                                <PreviewBox>
                                    {selectedFile.mediaType === 'IMAGE' ? (
                                        selectedFile.previewUrl ? (
                                            <img
                                                src={selectedFile.previewUrl}
                                                alt={selectedFile.file.name}
                                            />
                                        ) : (
                                            <PreviewPlaceholder>
                                                <FiImage />
                                            </PreviewPlaceholder>
                                        )
                                    ) : (
                                        <PreviewPlaceholder>
                                            <FiVideo />
                                        </PreviewPlaceholder>
                                    )}
                                </PreviewBox>

                                <SelectedFileInfo>
                                    <FileTypeBadge>
                                        {selectedFile.mediaType === 'IMAGE' ? <FiImage /> : <FiVideo />}
                                        {selectedFile.mediaType === 'IMAGE' ? 'Фото' : 'Видео'}
                                    </FileTypeBadge>

                                    <strong>{selectedFile.file.name}</strong>

                                    <span>{formatFileSize(selectedFile.file.size)}</span>
                                </SelectedFileInfo>

                                <RemoveFileButton type="button" onClick={handleRemoveFile}>
                                    <FiTrash2 />
                                    Удалить
                                </RemoveFileButton>
                            </SelectedFile>
                        )}
                    </FieldGroup>

                    {message && (
                        <StatusMessage $status={status}>
                            {status === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                            {message}
                        </StatusMessage>
                    )}

                    <SubmitButton type="submit" disabled={!canSubmit}>
                        <FiSend />
                        {isSubmitting ? 'Отправляем...' : 'Отправить заявку'}
                    </SubmitButton>
                </FormCard>

                {/*<SidePanel>
                    <InfoCard>
                        <FiFile />

                        <h2>Как это работает</h2>

                        <Steps>
                            <Step>
                                <strong>1</strong>
                                <span>Вы выбираете фото или видео из файлов.</span>
                            </Step>

                            <Step>
                                <strong>2</strong>
                                <span>Файл и данные заявки отправляются на backend.</span>
                            </Step>

                            <Step>
                                <strong>3</strong>
                                <span>Заявка попадает в админ-панель.</span>
                            </Step>

                            <Step>
                                <strong>4</strong>
                                <span>Результат появится в уведомлениях.</span>
                            </Step>
                        </Steps>
                    </InfoCard>

                    <InfoCard>
                        <FiAlertCircle />

                        <h2>Важно</h2>

                        <Text>
                            Описание необязательное. Для отправки нужны только название
                            минимум 3 символа и выбранный файл.
                        </Text>
                    </InfoCard>
                </SidePanel>*/}
            </Grid>
        </Page>
    );
}

function formatFileSize(size: number) {
    const mb = size / 1024 / 1024;

    if (mb >= 1) {
        return `${mb.toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof (error as { data?: { message?: unknown } }).data?.message === 'string'
    ) {
        return (error as { data: { message: string } }).data.message;
    }

    return fallback;
}

const Page = styled.div`
    display: grid;
    gap: 18px;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 18px;

    @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
        grid-template-columns: 1fr;
    }
`;

const FormCard = styled.form`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);
  display: grid;
  gap: 18px;
`;

const FieldGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
  font-weight: 900;
`;

const Input = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  outline: none;
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.text};

  &::placeholder {
    color: rgba(156, 163, 183, 0.7);
  }

  &:focus {
    border-color: rgba(139, 92, 246, 0.72);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 130px;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  outline: none;
  resize: vertical;
  background: rgba(255, 255, 255, 0.045);
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.55;

  &::placeholder {
    color: rgba(156, 163, 183, 0.7);
  }

  &:focus {
    border-color: rgba(139, 92, 246, 0.72);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
  }
`;

const Hint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-weight: 800;
`;

const VisibilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const VisibilityButton = styled.button<{ $active?: boolean }>`
  min-height: 84px;
  padding: 14px;
  border: 1px solid
    ${({ theme, $active }) =>
    $active ? 'rgba(139, 92, 246, 0.72)' : theme.colors.border};
  border-radius: 18px;
  background: ${({ $active }) =>
    $active
        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.32), rgba(37, 99, 235, 0.18))'
        : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;

  > svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 28px;
  }

  span {
    display: grid;
    gap: 4px;
  }

  strong {
    font-size: 15px;
  }

  small {
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.35;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadZone = styled.button`
  min-height: 220px;
  padding: 24px;
  border: 1px dashed rgba(139, 92, 246, 0.46);
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
    rgba(255, 255, 255, 0.035);
  color: ${({ theme }) => theme.colors.text};
  display: grid;
  place-items: center;
  gap: 8px;
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 46px;
  }

  strong {
    font-size: 22px;
    letter-spacing: -0.04em;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 700;
  }

  &:hover {
    border-color: rgba(139, 92, 246, 0.72);
    background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%),
      rgba(255, 255, 255, 0.055);
  }
`;

const SelectedFile = styled.div`
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: rgba(255, 255, 255, 0.04);
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const PreviewBox = styled.div`
  width: 120px;
  height: 96px;
  overflow: hidden;
  border-radius: 18px;
  background: #080a12;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    height: 180px;
  }
`;

const PreviewPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.3), transparent 34%),
    #080a12;
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-items: center;
  font-size: 34px;
`;

const SelectedFileInfo = styled.div`
  min-width: 0;
  display: grid;
  gap: 6px;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 800;
  }
`;

const FileTypeBadge = styled.div`
  width: fit-content;
  min-height: 30px;
  padding: 0 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(124, 58, 237, 0.14);
  color: #ddd6fe;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 900;
`;

const RemoveFileButton = styled.button`
    min-height: 40px;
    padding: 0 13px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: ${({ theme }) => theme.radius.full};
    background: rgba(239, 68, 68, 0.1);
    color: #fecaca;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-weight: 900;

    &:hover {
        background: rgba(239, 68, 68, 0.16);
    }
`;

const StatusMessage = styled.div<{ $status: FormStatus }>`
    padding: 13px 14px;
    border: 1px solid
    ${({ $status }) =>
            $status === 'success'
                    ? 'rgba(34, 197, 94, 0.34)'
                    : 'rgba(239, 68, 68, 0.34)'};
    border-radius: 18px;
    background: ${({ $status }) =>
            $status === 'success'
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)'};
    color: ${({ $status }) => ($status === 'success' ? '#bbf7d0' : '#fecaca')};
    display: flex;
    align-items: flex-start;
    gap: 9px;
    line-height: 1.45;
    font-weight: 800;

    svg {
        flex: 0 0 auto;
        margin-top: 2px;
    }
`;

const SubmitButton = styled.button`
    min-height: 52px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.full};
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-weight: 900;

    &:hover:not(:disabled) {
        filter: brightness(1.08);
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
`;

const SidePanel = styled.aside`
  display: grid;
  align-content: start;
  gap: 18px;
`;

const InfoCard = styled.section`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);

  > svg {
    margin-bottom: 14px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 34px;
  }

  h2 {
    margin: 0 0 14px;
    font-size: 24px;
    letter-spacing: -0.05em;
  }
`;

const Steps = styled.div`
  display: grid;
  gap: 10px;
`;

const Step = styled.div`
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.035);
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    gap: 10px;
    align-items: center;

    strong {
        width: 32px;
        height: 32px;
        border-radius: 12px;
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        color: white;
        display: grid;
        place-items: center;
    }

    span {
        color: ${({ theme }) => theme.colors.textMuted};
        line-height: 1.45;
        font-weight: 700;
    }
`;

const Text = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
`;