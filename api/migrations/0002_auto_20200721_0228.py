# Generated by Django 3.0.7 on 2020-07-21 02:28

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='buyorder',
            name='total_investment',
            field=models.FloatField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name='buyorder',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2020, 7, 21, 2, 28, 4, 247921, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='portfolio',
            name='date',
            field=models.DateTimeField(default=datetime.datetime(2020, 7, 21, 2, 28, 4, 244116, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='sellorder',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2020, 7, 21, 2, 28, 4, 247333, tzinfo=utc)),
        ),
    ]