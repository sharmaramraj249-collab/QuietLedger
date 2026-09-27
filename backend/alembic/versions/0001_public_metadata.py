"""create public receipt metadata
Revision ID: 0001_public_metadata
"""
from alembic import op
import sqlalchemy as sa
revision = "0001_public_metadata"
down_revision = None
branch_labels = None
depends_on = None
def upgrade():
    op.create_table(
        "proof_receipts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("transaction_id", sa.String(160), nullable=False),
        sa.Column("network", sa.String(20), nullable=False),
        sa.Column("window_id", sa.String(40), nullable=False),
        sa.Column("disclosure_scope", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_proof_receipts_transaction_id", "proof_receipts", ["transaction_id"], unique=True)
    op.create_table(
        "public_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("requirement_hash", sa.String(64), nullable=False),
        sa.Column("plan_source", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_public_requests_requirement_hash", "public_requests", ["requirement_hash"], unique=True)

def downgrade():
    op.drop_table("public_requests")
    op.drop_table("proof_receipts")
