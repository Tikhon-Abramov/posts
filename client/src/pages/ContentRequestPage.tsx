import { useMemo, useRef, useState } from 'react';
import type {ChangeEvent, FormEvent} from 'react';
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
                    previewUrl:
                        typeof reader.result === 'string' ? reader.result : null,
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
            setMessage(
                'Заявка отправлена админу. После проверки вы получите уведомление.'
            );

            resetForm();
        } catch (error) {
            setStatus('error');
            setMessage(getErrorMessage(error, 'Не удалось отправить заявку.'));
        }
    };

    return (
        <Page>
            <Hero>
                <HeroContent>
                    <Eyebrow>Предложить контент</Eyebrow>

                    <Title>Заявка на публикацию</Title>

                    <Subtitle>
                        Пользователи не публикуют посты напрямую. Вы отправляете фото или
                        видео на проверку, а админ решает: опубликовать материал в обычной
                        ленте, в Premium или отклонить заявку.
                    </Subtitle>
                </HeroContent>

                <HeroIcon>
                    <FiUploadCloud />
                </HeroIcon>
            </Hero>

            <ContentGrid>
                <FormCard onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Label htmlFor="request-title">Название</Label>

                        <Input
                            id="request-title"
                            value={title}
                            placeholder="Например: Неоновая фотосессия"
                            maxLength={90}
                            onChange={(event) => setTitle(event.target.value)}
                        />

                        <Hint>{title.trim().length}/90 символов</Hint>
                    </FieldGroup>

                    <FieldGroup>
                        <Label htmlFor="request-description">Описание</Label>

                        <Textarea
                            id="request-description"
                            value={description}
                            placeholder="Описание можно оставить пустым..."
                            maxLength={900}
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
                  <strong>Обычная лента</strong>
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

                                <span>
                  Фото до 8 MB или видео до 40 MB. Файл отправится на backend
                  через FormData в поле media.
                </span>
                            </UploadZone>
                        ) : (
                            <SelectedFile>
                                <PreviewBox>
                                    {selectedFile.mediaType === 'IMAGE' ? (
                                        selectedFile.previewUrl ? (
                                            <img src={selectedFile.previewUrl} alt={selectedFile.file.name} />
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

                <SidePanel>
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
                </SidePanel>
            </ContentGrid>
        </Page>
    );
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

function formatFileSize(size: number) {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

const Page = styled.div`
  display: grid;
  gap: 18px;
`;

const Hero = styled.section`
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%),
    radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
    rgba(21, 25, 43, 0.86);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px;
  }
`;

const HeroContent = styled.div`
  min-width: 0;
`;

const Eyebrow = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.primaryHover};
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(30px, 5vw, 52px);
  line-height: 0.96;
  letter-spacing: -0.075em;
`;

const Subtitle = styled.p`
  max-width: 720px;
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.65;
`;

const HeroIcon = styled.div`
  flex: 0 0 auto;
  width: 76px;
  height: 76px;
  border-radius: 28px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  display: grid;
  place-items: center;
  font-size: 36px;
  box-shadow: 0 22px 50px rgba(124, 58, 237, 0.28);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const FormCard = styled.form`
  min-width: 0;
  padding: 18px;
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
  font-size: 14px;
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
  min-height: 150px;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
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

const Hint = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-weight: 700;
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
  padding: 14px;
  border: 1px solid
    ${({ theme, $active }) =>
    $active ? 'rgba(139, 92, 246, 0.72)' : theme.colors.border};
  border-radius: 18px;
  background: ${({ $active }) =>
    $active
        ? 'linear-gradient(135deg, rgba(124,58,237,0.24), rgba(37,99,235,0.14))'
        : 'rgba(255,255,255,0.045)'};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;

  > svg {
    flex: 0 0 auto;
    margin-top: 2px;
    color: ${({ $active }) => ($active ? '#c4b5fd' : '#9ca3af')};
    font-size: 22px;
  }

  span {
    display: grid;
    gap: 4px;
  }

  strong {
    font-size: 14px;
  }

  small {
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.35;
    font-weight: 700;
  }

  &:hover {
    border-color: rgba(139, 92, 246, 0.52);
    background: rgba(255, 255, 255, 0.07);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadZone = styled.button`
  min-height: 260px;
  padding: 24px;
  border: 1px dashed rgba(139, 92, 246, 0.48);
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.18), transparent 34%),
    rgba(255, 255, 255, 0.035);
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 11px;
  text-align: center;

  > svg {
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 46px;
  }

  strong {
    font-size: 22px;
    letter-spacing: -0.04em;
  }

  span {
    max-width: 460px;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.55;
  }

  &:hover {
    border-color: rgba(139, 92, 246, 0.76);
    background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%),
      rgba(255, 255, 255, 0.055);
  }
`;

const SelectedFile = styled.div`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(255, 255, 255, 0.04);
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 140px minmax(0, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const PreviewBox = styled.div`
  overflow: hidden;
  height: 130px;
  border-radius: 18px;
  background: #05060d;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.28), transparent 36%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.22), transparent 36%),
    #080a12;
  color: ${({ theme }) => theme.colors.primaryHover};
  display: grid;
  place-items: center;
  font-size: 42px;
`;

const SelectedFileInfo = styled.div`
  min-width: 0;
  display: grid;
  gap: 7px;

  strong {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text};
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
  }
`;

const FileTypeBadge = styled.div`
  width: max-content;
  min-height: 32px;
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
  min-height: 42px;
  padding: 0 13px;
  border: 1px solid rgba(239, 68, 68, 0.32);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 900;

  &:hover {
    background: rgba(239, 68, 68, 0.16);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-column: 1 / -1;
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
  box-shadow: 0 18px 44px rgba(124, 58, 237, 0.22);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SidePanel = styled.aside`
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 18px;
`;

const InfoCard = styled.section`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.82);

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
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: flex-start;
  gap: 10px;

  strong {
    flex: 0 0 auto;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: white;
    display: grid;
    place-items: center;
    font-size: 12px;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.45;
    font-size: 14px;
    font-weight: 700;
  }
`;

const Text = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
`;