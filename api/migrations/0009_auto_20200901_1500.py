# Generated by Django 3.0.7 on 2020-09-01 15:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_auto_20200901_1456'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='position',
            unique_together=set(),
        ),
    ]
