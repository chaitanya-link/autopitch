import os

from app.models import Campaign


def get_sender_credentials(campaign: Campaign) -> tuple[str, str]:
    """Returns (sender_email, sender_app_password) for a campaign.

    Falls back to the global GMAIL_SENDER_ADDRESS/GMAIL_APP_PASSWORD env vars for
    campaigns created before per-campaign sender credentials existed.
    """
    sender = campaign.sender_email or os.environ["GMAIL_SENDER_ADDRESS"]
    password = campaign.sender_app_password or os.environ["GMAIL_APP_PASSWORD"]
    return sender, password
