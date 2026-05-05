const { pool } = require('../../config/db');

function toIsoDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date(value).toISOString();
}

function mapSubscriptionRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: Number(row.id),
        userId: Number(row.user_id),
        plan: row.plan,
        status: row.status,
        startedAt: toIsoDate(row.started_at),
        expiresAt: toIsoDate(row.expires_at),
        createdAt: toIsoDate(row.created_at),
        updatedAt: toIsoDate(row.updated_at),
    };
}

async function getMySubscription(userId) {
    const [userRows] = await pool.execute(
        `
      SELECT
        id,
        has_premium
      FROM users
      WHERE id = :userId
      LIMIT 1
    `,
        {
            userId,
        }
    );

    const [subscriptionRows] = await pool.execute(
        `
      SELECT
        id,
        user_id,
        plan,
        status,
        started_at,
        expires_at,
        created_at,
        updated_at
      FROM subscriptions
      WHERE user_id = :userId
        AND status = 'ACTIVE'
        AND (
          expires_at IS NULL
          OR expires_at > NOW()
        )
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
        {
            userId,
        }
    );

    const subscription = mapSubscriptionRow(subscriptionRows[0]);

    return {
        hasPremium: Boolean(userRows[0]?.has_premium) && Boolean(subscription),
        subscription,
    };
}

async function activateTestSubscription(userId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `
        UPDATE subscriptions
        SET
          status = 'CANCELED',
          updated_at = NOW()
        WHERE user_id = :userId
          AND status = 'ACTIVE'
      `,
            {
                userId,
            }
        );

        const [result] = await connection.execute(
            `
        INSERT INTO subscriptions (
          user_id,
          plan,
          status,
          started_at,
          expires_at
        )
        VALUES (
          :userId,
          'TEST',
          'ACTIVE',
          NOW(),
          DATE_ADD(NOW(), INTERVAL 30 DAY)
        )
      `,
            {
                userId,
            }
        );

        await connection.execute(
            `
        UPDATE users
        SET has_premium = TRUE
        WHERE id = :userId
      `,
            {
                userId,
            }
        );

        await connection.commit();

        return {
            message: 'Тестовая подписка активирована.',
            hasPremium: true,
            subscription: {
                id: Number(result.insertId),
                userId: Number(userId),
                plan: 'TEST',
                status: 'ACTIVE',
                startedAt: new Date().toISOString(),
                expiresAt: null,
            },
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function cancelSubscription(userId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `
        UPDATE subscriptions
        SET
          status = 'CANCELED',
          updated_at = NOW()
        WHERE user_id = :userId
          AND status = 'ACTIVE'
      `,
            {
                userId,
            }
        );

        await connection.execute(
            `
        UPDATE users
        SET has_premium = FALSE
        WHERE id = :userId
      `,
            {
                userId,
            }
        );

        await connection.commit();

        return {
            message: 'Подписка отменена.',
            hasPremium: false,
            subscription: null,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getMySubscription,
    activateTestSubscription,
    cancelSubscription,
};