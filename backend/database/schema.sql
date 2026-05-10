create database tishkagram;
USE tishkagram;

CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                     nickname VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    has_premium BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_nickname (nickname),
    KEY idx_users_role (role),
    KEY idx_users_has_premium (has_premium)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
                                     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                     author_id BIGINT UNSIGNED NOT NULL,
                                     title VARCHAR(120) NOT NULL,
    description TEXT NULL,
    visibility ENUM('PUBLIC', 'PREMIUM') NOT NULL DEFAULT 'PUBLIC',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    PRIMARY KEY (id),
    KEY idx_posts_author_id (author_id),
    KEY idx_posts_visibility_created_at (visibility, created_at, id),
    KEY idx_posts_created_at (created_at, id),
    KEY idx_posts_deleted_at (deleted_at),

    CONSTRAINT fk_posts_author
    FOREIGN KEY (author_id)
    REFERENCES users(id)
                                                           ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_media (
                                          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                          post_id BIGINT UNSIGNED NOT NULL,
                                          type ENUM('IMAGE', 'VIDEO') NOT NULL,
    url VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_post_media_post_id (post_id),

    CONSTRAINT fk_post_media_post
    FOREIGN KEY (post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_reactions (
                                              id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                              post_id BIGINT UNSIGNED NOT NULL,
                                              user_id BIGINT UNSIGNED NOT NULL,
                                              type ENUM('LIKE', 'DISLIKE') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_post_reactions_post_user (post_id, user_id),
    KEY idx_post_reactions_user_id (user_id),
    KEY idx_post_reactions_post_type (post_id, type),

    CONSTRAINT fk_post_reactions_post
    FOREIGN KEY (post_id)
    REFERENCES posts(id)
                                                           ON DELETE CASCADE,

    CONSTRAINT fk_post_reactions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
                                                           ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_posts (
                                           id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                           post_id BIGINT UNSIGNED NOT NULL,
                                           user_id BIGINT UNSIGNED NOT NULL,
                                           created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                           PRIMARY KEY (id),
    UNIQUE KEY uq_saved_posts_post_user (post_id, user_id),
    KEY idx_saved_posts_user_created_at (user_id, created_at, id),
    KEY idx_saved_posts_post_id (post_id),

    CONSTRAINT fk_saved_posts_post
    FOREIGN KEY (post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_saved_posts_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
                                        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                        post_id BIGINT UNSIGNED NOT NULL,
                                        author_id BIGINT UNSIGNED NOT NULL,
                                        text TEXT NOT NULL,
                                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                        deleted_at DATETIME NULL,

                                        PRIMARY KEY (id),
    KEY idx_comments_post_created_at (post_id, created_at, id),
    KEY idx_comments_author_id (author_id),
    KEY idx_comments_deleted_at (deleted_at),

    CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_comments_author
    FOREIGN KEY (author_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_requests (
                                                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                                user_id BIGINT UNSIGNED NOT NULL,
                                                title VARCHAR(120) NOT NULL,
    description TEXT NULL,
    suggested_visibility ENUM('PUBLIC', 'PREMIUM') NOT NULL DEFAULT 'PUBLIC',
    media_type ENUM('IMAGE', 'VIDEO') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewed_at DATETIME NULL,
    published_post_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_content_requests_user_created_at (user_id, created_at, id),
    KEY idx_content_requests_status_created_at (status, created_at, id),
    KEY idx_content_requests_media_type (media_type),
    KEY idx_content_requests_published_post_id (published_post_id),

    CONSTRAINT fk_content_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
                                                           ON DELETE CASCADE,

    CONSTRAINT fk_content_requests_published_post
    FOREIGN KEY (published_post_id)
    REFERENCES posts(id)
                                                           ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
                                             id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                             user_id BIGINT UNSIGNED NOT NULL,
                                             type ENUM(
                                             'REQUEST_APPROVED',
                                             'REQUEST_REJECTED',
                                             'NEW_LIKE',
                                             'NEW_COMMENT'
) NOT NULL,
    title VARCHAR(160) NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    post_id BIGINT UNSIGNED NULL,
    request_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_notifications_user_created_at (user_id, created_at, id),
    KEY idx_notifications_user_is_read (user_id, is_read),
    KEY idx_notifications_type (type),
    KEY idx_notifications_post_id (post_id),
    KEY idx_notifications_request_id (request_id),

    CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_notifications_post
    FOREIGN KEY (post_id)
    REFERENCES posts(id)
    ON DELETE SET NULL,

    CONSTRAINT fk_notifications_request
    FOREIGN KEY (request_id)
    REFERENCES content_requests(id)
    ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
                                             id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                             user_id BIGINT UNSIGNED NOT NULL,
                                             plan ENUM('MONTHLY', 'YEARLY', 'TEST') NOT NULL DEFAULT 'TEST',
    status ENUM('ACTIVE', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_subscriptions_user_status (user_id, status),
    KEY idx_subscriptions_expires_at (expires_at),

    CONSTRAINT fk_subscriptions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
                                                           ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


    ALTER TABLE notifications
  ADD COLUMN actor_user_id INT NULL AFTER user_id;

CREATE INDEX idx_notifications_like_dedupe
  ON notifications (user_id, type, post_id, actor_user_id);