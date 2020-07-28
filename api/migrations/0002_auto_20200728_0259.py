# Generated by Django 3.0.7 on 2020-07-28 02:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='position',
            options={'ordering': ['-open_date']},
        ),
        migrations.AddConstraint(
            model_name='position',
            constraint=models.UniqueConstraint(condition=models.Q(close_date__isnull=True), fields=('stock',), name='unique stock if in portfolio'),
        ),
    ]
