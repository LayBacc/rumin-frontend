from django.urls import path
from . import views


urlpatterns = [
	# path('', views.index ),
	path('search', views.search),
	path('sites/john', views.knowledge_artist, name='knowledge_artist'),
	path('sites/validate', views.validate_aas, name='validate_aas'),
	path('sites/coding_utility', views.coding_utility, name='coding_utility'),
	path('code/<str:short_url>', views.coding_lookup_article, name='coding_lookup_article'),
	path('about_validate', views.about_validate, name='about_validate'),


	path('spaces/<str:pk>', views.space_detail, name='space_detail'),
	path('spaces/<str:pk>/presentation', views.space_presentation),
	path('resources/<str:pk>', views.resource_detail),
	path('activities/<str:pk>', views.activity_detail),
	
	# the old Rumin blog
	path('blog', views.rumin_blog, name='blog'),
	path('blog/<str:pk>', views.blog_detail),

	# Knowldge Artist
	path('newsletter', views.ka_newsletter),
	path('newsletter/<str:short_url>', views.ka_newsletter_post),
	path('music', views.ka_music),
	path('drawings', views.ka_drawings),
	path('articles', views.ka_articles),
	path('articles/future-of-search', views.ka_future_of_search),
	path('article/<str:short_url>', views.ka_article_short_url),
	path('articles/<str:pk>', views.ka_article_detail),
	path('articles/<str:pk>/<slug:slug>', views.ka_article_detail),

	# the old r/BJJ 
	path('wiki/<str:pk>', views.wiki_detail),
	path('url/<str:encoded_url>', views.saved_url),
	path('s/new', views.new_short_link),
	path('r/grappling', views.bjj_page),
	path('r/bjj', views.bjj_page),
	path('explorer', views.explorer),
	path('expdemo', views.explorer),
	path('demo_graph', views.demo_graph),
	path('demo_log', views.demo_log),
	path('demo_writer', views.demo_writer),
	path('demo_grid_board', views.demo_grid_board),
	path('demo_mood_board', views.demo_mood_board),
	path('demo_log_list', views.demo_log_list),
]
