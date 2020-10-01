# from django.views.generic import TemplateView
# from django.views.decorators.cache import never_cache

# Serve Single Page Application
#index = never_cache(TemplateView.as_view(template_name='index.html'))


# import os
# import logging
# from django.http import HttpResponse
# from django.views.generic import View
# from django.conf import settings

# class FrontendAppView(View):
#     """
#     Serves the compiled frontend entry point (only works if you have run `yarn
#     build`).
#     """
#     index_file_path = os.path.join(settings.BASE_DIR, 'build', 'index.html')
#     print(index_file_path)

#     def get(self, request):
#         try:
#             with open(self.index_file_path) as f:
#                 return HttpResponse(f.read())
#         except FileNotFoundError:
#             logging.exception('Production build of app not found')
#             return HttpResponse(
#                 """
#                 This URL is only used when you have built the production
#                 version of the app. Visit http://localhost:3000/ instead after
#                 running `yarn start` on the frontend/ directory
#                 """,
#                 status=501,
#             )
import os
from django.shortcuts import render
from django.conf import settings

def index(request):
    return render(request, os.path.join(settings.BASE_DIR, 'build', 'index.html'))
