from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_userlegalacceptance_userpreference'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='has_completed_onboarding',
            field=models.BooleanField(
                default=False,
                help_text='Whether the user has completed required onboarding and setup.',
            ),
        ),
    ]
