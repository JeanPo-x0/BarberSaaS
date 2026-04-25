"""barbero email unique per barberia

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-04-25
"""
from alembic import op

revision = 'm3n4o5p6q7r8'
down_revision = 'l2m3n4o5p6q7'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the global unique constraint on barberos.email
    op.drop_index('ix_barberos_email', table_name='barberos')
    # Recreate as non-unique index (for query performance)
    op.create_index('ix_barberos_email', 'barberos', ['email'], unique=False)
    # Add composite unique constraint: same email cannot appear twice in the same barberia
    op.create_index(
        'uq_barberos_email_barberia',
        'barberos',
        ['email', 'barberia_id'],
        unique=True,
        postgresql_where='email IS NOT NULL',
    )


def downgrade():
    op.drop_index('uq_barberos_email_barberia', table_name='barberos')
    op.drop_index('ix_barberos_email', table_name='barberos')
    op.create_index('ix_barberos_email', 'barberos', ['email'], unique=True)
