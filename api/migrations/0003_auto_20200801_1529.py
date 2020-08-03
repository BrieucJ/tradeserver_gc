# Generated by Django 3.0.7 on 2020-08-01 15:29

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_auto_20200728_0259'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='portfolio',
            name='cash',
        ),
        migrations.RemoveField(
            model_name='portfolio',
            name='initial_balance',
        ),
        migrations.RemoveField(
            model_name='portfolio',
            name='total_invested_value',
        ),
        migrations.CreateModel(
            name='PortfolioHistory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cash', models.FloatField(default=None, null=True)),
                ('total_invested_value', models.FloatField(default=None, null=True)),
                ('updated_at', models.DateTimeField(blank=True, default=django.utils.timezone.now)),
                ('portfolio', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='portfolio_history', to='api.Portfolio')),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
    ]
