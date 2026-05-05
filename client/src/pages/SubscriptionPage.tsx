import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiUser,
  FiZap,
} from 'react-icons/fi';

import type { AppDispatch, RootState } from '../app/store';
import { setUser } from '../entities/auth/slice/authSlice';
import {
  useActivateTestSubscriptionMutation,
  useCancelSubscriptionMutation,
  useGetMySubscriptionQuery,
} from '../entities/subscription/api/subscriptionApi';

type BillingPeriod = 'MONTHLY' | 'YEARLY';

export function SubscriptionPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { user, accessToken } = useSelector((state: RootState) => state.auth);

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: subscriptionData,
    isLoading: isSubscriptionLoading,
    refetch: refetchSubscription,
  } = useGetMySubscriptionQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [activateTestSubscription, { isLoading: isActivating }] =
      useActivateTestSubscriptionMutation();

  const [cancelSubscription, { isLoading: isCanceling }] =
      useCancelSubscriptionMutation();

  const price = useMemo(() => {
    return billingPeriod === 'MONTHLY' ? '499 ₽' : '4 990 ₽';
  }, [billingPeriod]);

  const periodText = billingPeriod === 'MONTHLY' ? 'в месяц' : 'в год';

  const hasPremium = Boolean(user?.hasPremium || subscriptionData?.hasPremium);
  const isProcessing = isActivating || isCanceling;

  const handleBuySubscription = async () => {
    if (!user) {
      setErrorMessage('Пользователь не найден. Войдите в аккаунт заново.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await activateTestSubscription().unwrap();

      dispatch(
          setUser({
            ...user,
            hasPremium: result.hasPremium,
          })
      );

      await refetchSubscription();

      setSuccessMessage('Подписка активирована. Теперь вам доступна Premium-лента.');
    } catch (error) {
      setErrorMessage(
          getErrorMessage(error, 'Не удалось активировать подписку. Попробуйте еще раз.')
      );
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) {
      return;
    }

    const isConfirmed = window.confirm('Отменить активную подписку?');

    if (!isConfirmed) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await cancelSubscription().unwrap();

      dispatch(
          setUser({
            ...user,
            hasPremium: result.hasPremium,
          })
      );

      await refetchSubscription();

      setSuccessMessage('Подписка отменена.');
    } catch (error) {
      setErrorMessage(
          getErrorMessage(error, 'Не удалось отменить подписку. Попробуйте еще раз.')
      );
    }
  };

  if (accessToken && !user) {
    return (
        <StateCard>
          <FiRefreshCw />

          <h1>Проверяем аккаунт</h1>

          <p>Сейчас подтвердим сессию и загрузим информацию о подписке.</p>
        </StateCard>
    );
  }

  if (!user) {
    return (
        <StateCard>
          <FiLock />

          <h1>Нужна авторизация</h1>

          <p>Чтобы оформить подписку, нужно войти в аккаунт.</p>
        </StateCard>
    );
  }

  if (hasPremium) {
    return (
        <Page>
          <ActiveHero>
            <ActiveIcon>
              <FiCheckCircle />
            </ActiveIcon>

            <Eyebrow>Premium active</Eyebrow>

            <Title>Подписка активна</Title>

            <Subtitle>
              У вас есть доступ к закрытой ленте. Можно смотреть Premium-посты,
              лайкать, сохранять и комментировать публикации.
            </Subtitle>

            <ActiveActions>
              <PrimaryLink to="/premium">
                <FiStar />
                Открыть Premium-ленту
              </PrimaryLink>

              <SecondaryLink to="/profile">
                <FiUser />
                В профиль
              </SecondaryLink>

              <DangerButton
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancelSubscription}
              >
                {isCanceling ? 'Отменяем...' : 'Отменить подписку'}
              </DangerButton>
            </ActiveActions>

            {successMessage && (
                <SuccessBox>
                  <FiCheckCircle />
                  {successMessage}
                </SuccessBox>
            )}

            {errorMessage && (
                <ErrorBox>
                  <FiAlertCircle />
                  {errorMessage}
                </ErrorBox>
            )}
          </ActiveHero>

          <BenefitsGrid>
            <BenefitCard>
              <FiLock />

              <h2>Закрытый контент</h2>

              <p>Доступ к публикациям, которые не видны обычным пользователям.</p>
            </BenefitCard>

            <BenefitCard>
              <FiZap />

              <h2>Больше возможностей</h2>

              <p>Premium-лента работает отдельно от обычной публичной ленты.</p>
            </BenefitCard>

            <BenefitCard>
              <FiShield />

              <h2>Приватный доступ</h2>

              <p>Контент доступен только аккаунтам с активной подпиской.</p>
            </BenefitCard>
          </BenefitsGrid>
        </Page>
    );
  }

  return (
      <Page>
        <Grid>
          <PlanCard>
            <PlanHeader>
              <div>
                <Eyebrow>Premium</Eyebrow>
                <h2>Открой закрытую ленту</h2>
              </div>

              <PlanBadge>
                <FiStar />
                Pulse Premium
              </PlanBadge>
            </PlanHeader>

            <BillingSwitch>
              <BillingButton
                  type="button"
                  $active={billingPeriod === 'MONTHLY'}
                  onClick={() => setBillingPeriod('MONTHLY')}
              >
                Ежемесячно
              </BillingButton>

              <BillingButton
                  type="button"
                  $active={billingPeriod === 'YEARLY'}
                  onClick={() => setBillingPeriod('YEARLY')}
              >
                На год
              </BillingButton>
            </BillingSwitch>

            <PriceBlock>
              <strong>{price}</strong>
              <span>{periodText}</span>
            </PriceBlock>

            {billingPeriod === 'YEARLY' && (
                <DiscountBox>
                  <FiCheckCircle />
                  Годовой вариант выгоднее примерно на 2 месяца.
                </DiscountBox>
            )}

            <Features>
              <Feature>
                <FiCheck />
                Доступ к Premium-ленте
              </Feature>

              <Feature>
                <FiCheck />
                Закрытые фото и видео
              </Feature>

              <Feature>
                <FiCheck />
                Возможность сохранять Premium-посты
              </Feature>

              <Feature>
                <FiCheck />
                Отдельный доступ к закрытым публикациям
              </Feature>
            </Features>

            {successMessage && (
                <SuccessBox>
                  <FiCheckCircle />
                  {successMessage}
                </SuccessBox>
            )}

            {errorMessage && (
                <ErrorBox>
                  <FiAlertCircle />
                  {errorMessage}
                </ErrorBox>
            )}

            <BuyButton
                type="button"
                disabled={isProcessing || isSubscriptionLoading}
                onClick={handleBuySubscription}
            >
              <FiCreditCard />
              {isActivating ? 'Активируем...' : 'Оформить подписку'}
            </BuyButton>
          </PlanCard>

          <InfoColumn>
            <InfoCard>
              <InfoIcon>
                <FiLock />
              </InfoIcon>

              <h2>Что откроется</h2>

              <p>
                После активации backend обновит статус подписки в базе данных, а
                Premium-лента станет доступна без перезагрузки аккаунта.
              </p>
            </InfoCard>

            <InfoCard>
              <InfoIcon>
                <FiUser />
              </InfoIcon>

              <h2>Текущий аккаунт</h2>

              <AccountLine>
                <strong>{user.nickname}</strong>
                <span>{user.email}</span>
              </AccountLine>
            </InfoCard>
          </InfoColumn>
        </Grid>
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

const Page = styled.div`
  display: grid;
  gap: 18px;
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
  font-size: clamp(30px, 5vw, 56px);
  line-height: 0.96;
  letter-spacing: -0.075em;
`;

const Subtitle = styled.p`
  max-width: 720px;
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.65;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled.section`
  padding: 22px;
  border: 1px solid rgba(236, 72, 153, 0.26);
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
      radial-gradient(circle at top left, rgba(236, 72, 153, 0.18), transparent 34%),
      radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.22), transparent 34%),
      rgba(21, 25, 43, 0.88);
  display: grid;
  gap: 18px;
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  h2 {
    margin: 4px 0 0;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1;
    letter-spacing: -0.07em;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const PlanBadge = styled.div`
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid rgba(236, 72, 153, 0.34);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(236, 72, 153, 0.12);
  color: #fbcfe8;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 900;
`;

const BillingSwitch = styled.div`
  padding: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
`;

const BillingButton = styled.button<{ $active?: boolean }>`
  min-height: 46px;
  border: none;
  border-radius: 16px;
  background: ${({ $active }) =>
    $active
        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(236, 72, 153, 0.85))'
        : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.text : theme.colors.textMuted};
  font-weight: 900;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ $active }) =>
    $active
        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(236, 72, 153, 0.85))'
        : 'rgba(255, 255, 255, 0.06)'};
  }
`;

const PriceBlock = styled.div`
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.045);
  display: flex;
  align-items: end;
  gap: 10px;

  strong {
    font-size: clamp(42px, 8vw, 72px);
    line-height: 0.9;
    letter-spacing: -0.08em;
  }

  span {
    margin-bottom: 7px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 900;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: flex-start;
    flex-direction: column;

    span {
      margin-bottom: 0;
    }
  }
`;

const DiscountBox = styled.div`
  padding: 13px 14px;
  border: 1px solid rgba(34, 197, 94, 0.32);
  border-radius: 18px;
  background: rgba(34, 197, 94, 0.1);
  color: #bbf7d0;
  display: flex;
  gap: 10px;
  line-height: 1.45;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const Features = styled.div`
  display: grid;
  gap: 10px;
`;

const Feature = styled.div`
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    color: #86efac;
    font-size: 20px;
  }
`;

const BuyButton = styled.button`
  min-height: 56px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 900;
  box-shadow: 0 20px 50px rgba(236, 72, 153, 0.25);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InfoColumn = styled.aside`
  display: grid;
  align-content: start;
  gap: 18px;
`;

const InfoCard = styled.section`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);

  h2 {
    margin: 14px 0 8px;
    font-size: 24px;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;

const InfoIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 18px;
  background: rgba(236, 72, 153, 0.12);
  color: #f9a8d4;
  display: grid;
  place-items: center;
  font-size: 22px;
`;

const AccountLine = styled.div`
  margin-top: 14px;
  padding: 13px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.04);
  display: grid;
  gap: 4px;

  strong {
    color: ${({ theme }) => theme.colors.text};
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    font-weight: 700;
    word-break: break-word;
  }
`;

const SuccessBox = styled.div`
  padding: 13px 14px;
  border: 1px solid rgba(34, 197, 94, 0.32);
  border-radius: 18px;
  background: rgba(34, 197, 94, 0.1);
  color: #bbf7d0;
  display: flex;
  gap: 10px;
  line-height: 1.45;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const ErrorBox = styled.div`
  padding: 13px 14px;
  border: 1px solid rgba(239, 68, 68, 0.32);
  border-radius: 18px;
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  display: flex;
  gap: 10px;
  line-height: 1.45;
  font-weight: 800;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const ActiveHero = styled.section`
  min-height: 420px;
  padding: 34px 24px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), transparent 34%),
    radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.2), transparent 34%),
    rgba(21, 25, 43, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  ${Subtitle} {
    max-width: 620px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 380px;
    padding: 28px 18px;
  }
`;

const ActiveIcon = styled.div`
  width: 86px;
  height: 86px;
  margin-bottom: 18px;
  border-radius: 32px;
  background: linear-gradient(135deg, #16a34a, #7c3aed);
  color: white;
  display: grid;
  place-items: center;
  font-size: 42px;
  box-shadow: 0 24px 60px rgba(34, 197, 94, 0.25);
`;

const ActiveActions = styled.div`
  margin-top: 28px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const PrimaryLink = styled(Link)`
  min-height: 50px;
  padding: 0 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-weight: 900;

  &:hover {
    filter: brightness(1.08);
  }
`;

const SecondaryLink = styled(Link)`
  min-height: 50px;
  padding: 0 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-weight: 900;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DangerButton = styled.button`
  min-height: 50px;
  padding: 0 18px;
  border: 1px solid rgba(239, 68, 68, 0.32);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  font-weight: 900;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.16);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const BenefitCard = styled.section`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: rgba(21, 25, 43, 0.84);

  svg {
    margin-bottom: 14px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 34px;
  }

  h2 {
    margin: 0 0 8px;
    font-size: 23px;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.55;
  }
`;

const StateCard = styled.section`
  min-height: 420px;
  padding: 30px 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.2), transparent 34%),
      rgba(21, 25, 43, 0.86);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  > svg {
    margin-bottom: 16px;
    color: ${({ theme }) => theme.colors.primaryHover};
    font-size: 44px;
  }

  h1 {
    margin: 0 0 10px;
    font-size: clamp(26px, 4vw, 40px);
    letter-spacing: -0.06em;
  }

  p {
    max-width: 500px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.6;
  }
`;