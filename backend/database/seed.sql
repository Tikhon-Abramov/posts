USE pulsefeed_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE subscriptions;
TRUNCATE TABLE notifications;
TRUNCATE TABLE content_requests;
TRUNCATE TABLE comments;
TRUNCATE TABLE saved_posts;
TRUNCATE TABLE post_reactions;
TRUNCATE TABLE post_media;
TRUNCATE TABLE posts;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (
    id,
    nickname,
    email,
    password_hash,
    avatar_url,
    role,
    has_premium
) VALUES
      (
          1,
          'admin',
          'admin@pulsefeed.test',
          '$2a$10$kF/.JUB8iA/hdFqWRa15jeJJxPd6XxeVDY1A/P9Nnjc4t3Q4SrzUu',
          NULL,
          'ADMIN',
          TRUE
      ),
      (
          2,
          'user',
          'user@pulsefeed.test',
          '$2a$10$kF/.JUB8iA/hdFqWRa15jeJJxPd6XxeVDY1A/P9Nnjc4t3Q4SrzUu',
          NULL,
          'USER',
          FALSE
      ),
      (
          3,
          'premium_user',
          'premium@pulsefeed.test',
          '$2a$10$kF/.JUB8iA/hdFqWRa15jeJJxPd6XxeVDY1A/P9Nnjc4t3Q4SrzUu',
          NULL,
          'USER',
          TRUE
      );

INSERT INTO subscriptions (
    user_id,
    plan,
    status,
    started_at,
    expires_at
) VALUES
      (
          1,
          'TEST',
          'ACTIVE',
          NOW(),
          DATE_ADD(NOW(), INTERVAL 1 YEAR)
      ),
      (
          3,
          'TEST',
          'ACTIVE',
          NOW(),
          DATE_ADD(NOW(), INTERVAL 1 YEAR)
      );

INSERT INTO posts (
    id,
    author_id,
    title,
    description,
    visibility,
    created_at
) VALUES
      (
          1,
          1,
          'Неоновый вечер',
          'Обычный публичный пост. Его видят все пользователи, даже без авторизации.',
          'PUBLIC',
          DATE_SUB(NOW(), INTERVAL 40 MINUTE)
      ),
      (
          2,
          1,
          'Город после дождя',
          'Пост с фото в ленте. Backend отдает настоящий URL медиа из таблицы post_media.',
          'PUBLIC',
          DATE_SUB(NOW(), INTERVAL 4 HOUR)
      ),
      (
          3,
          1,
          'Premium: закрытый фотосет',
          'Этот пост должен быть виден только пользователям с активной подпиской.',
          'PREMIUM',
          DATE_SUB(NOW(), INTERVAL 9 HOUR)
      ),
      (
          4,
          1,
          'Premium: видео-превью',
          'Тестовый видео-пост для проверки Premium-ленты.',
          'PREMIUM',
          DATE_SUB(NOW(), INTERVAL 16 HOUR)
      ),
      (
          5,
          1,
          'Красный акцент',
          'Еще один публичный пост для проверки ленты, лайков, дизлайков и сохранений.',
          'PUBLIC',
          DATE_SUB(NOW(), INTERVAL 1 DAY)
      );

INSERT INTO post_media (
    id,
    post_id,
    type,
    url
) VALUES
      (
          1,
          1,
          'IMAGE',
          'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&auto=format&fit=crop'
      ),
      (
          2,
          2,
          'IMAGE',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop'
      ),
      (
          3,
          3,
          'IMAGE',
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop'
      ),
      (
          4,
          4,
          'VIDEO',
          'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
      ),
      (
          5,
          5,
          'IMAGE',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop'
      );

INSERT INTO post_reactions (
    post_id,
    user_id,
    type
) VALUES
      (1, 2, 'LIKE'),
      (1, 3, 'LIKE'),
      (2, 2, 'LIKE'),
      (3, 3, 'LIKE'),
      (5, 2, 'DISLIKE');

INSERT INTO saved_posts (
    post_id,
    user_id
) VALUES
      (1, 2),
      (3, 3),
      (4, 3);

INSERT INTO comments (
    post_id,
    author_id,
    text,
    created_at
) VALUES
      (
          1,
          2,
          'Красивый пост, отлично смотрится в ленте.',
          DATE_SUB(NOW(), INTERVAL 25 MINUTE)
      ),
      (
          1,
          3,
          'Неоновая атмосфера очень крутая.',
          DATE_SUB(NOW(), INTERVAL 20 MINUTE)
      ),
      (
          3,
          3,
          'Premium-контент отображается корректно.',
          DATE_SUB(NOW(), INTERVAL 2 HOUR)
      );

INSERT INTO content_requests (
    id,
    user_id,
    title,
    description,
    suggested_visibility,
    media_type,
    file_name,
    file_url,
    file_size,
    status,
    reviewed_at,
    published_post_id,
    created_at
) VALUES
      (
          1,
          2,
          'Фото от пользователя',
          'Тестовая заявка на публикацию в обычной ленте.',
          'PUBLIC',
          'IMAGE',
          'user-photo.jpg',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop',
          345000,
          'PENDING',
          NULL,
          NULL,
          DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      ),
      (
          2,
          3,
          'Premium заявка',
          '',
          'PREMIUM',
          'IMAGE',
          'premium-photo.jpg',
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop',
          512000,
          'APPROVED',
          DATE_SUB(NOW(), INTERVAL 1 HOUR),
          3,
          DATE_SUB(NOW(), INTERVAL 2 HOUR)
      );

INSERT INTO notifications (
    user_id,
    type,
    title,
    text,
    is_read,
    post_id,
    request_id,
    created_at
) VALUES
      (
          3,
          'REQUEST_APPROVED',
          'Публикация одобрена',
          'Ваша заявка «Premium заявка» опубликована в Premium-ленте.',
          FALSE,
          3,
          2,
          DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ),
      (
          1,
          'NEW_COMMENT',
          'Новый комментарий',
          '@user оставил комментарий к вашей публикации «Неоновый вечер».',
          FALSE,
          1,
          NULL,
          DATE_SUB(NOW(), INTERVAL 25 MINUTE)
      ),
      (
          1,
          'NEW_LIKE',
          'Новый лайк',
          '@premium_user поставил лайк вашей публикации «Неоновый вечер».',
          FALSE,
          1,
          NULL,
          DATE_SUB(NOW(), INTERVAL 18 MINUTE)
      );