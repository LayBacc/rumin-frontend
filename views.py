from django.shortcuts import render, redirect
from django.urls import reverse
from spaces.models import Space, serialize_html

def index(request):
	return render(request, 'frontend/index.html')

def user_profile(request, pk):
	return render(request, 'frontend/index.html')

def knowledge_artist(request):
	return render(request, 'frontend/knowledge_artist.html')

def validate_aas(request):
	return render(request, 'frontend/validate_aas.html')

def coding_utility(request):
	return render(request, 'frontend/coding_utility.html')

def coding_lookup_article(request, short_url):
	space = Space.objects.filter(short_url=short_url).first()
	if not space or not space.is_public:
		return 	render(request, 'frontend/ka_404.html')

	return render(request, 'frontend/coding_lookup_article.html', { 'space': space, 'html_body': serialize_html({ 'children': space.json_body }), 'keywords': space.custom_fields.get('meta_keywords'), 'description': space.custom_fields.get('meta_description') })

def about_validate(request):
	return render(request, 'frontend/about_validate.html')

def search(request):
	return render(request, 'frontend/index.html')

def space_detail(request, pk):
	return render(request, 'frontend/index.html')

def space_presentation(request, pk):
	return render(request, 'frontend/index.html')

def resource_detail(request, pk):
	return render(request, 'frontend/index.html')

def rumin_blog(request):
	return render(request, 'frontend/index.html')

def explorer(request):
	return render(request, 'frontend/explorer.html')

def blog_detail(request, pk):
	# Dropshipping, part 1
	if pk == '2dd7efe6-b375-4a39-99ad-36a156ba423c':
		return redirect('https://knowledgeartist.org/articles/fbd09646-e750-48fd-a90f-7f8fb9b6f456/everything-i-learned-starting-a-6000mo-dropshipping-business')

	# What is Zettelkasten
	if pk == '64b01dcd-1890-4817-9887-42fb9575614c':
		return redirect('https://knowledgeartist.org/articles/64b01dcd-1890-4817-9887-42fb9575614c/what-is-zettelkasten')

	# masks for all, traditional Chinese
	if pk == '0a7db3f3-f5a4-4e44-956d-0c8d73e55050':
		return redirect('https://knowledgeartist.org/articles/0a7db3f3-f5a4-4e44-956d-0c8d73e55050')

	# masks for all, simplified 
	if pk == 'd7e7c832-51bc-4e7d-9684-d822ed91ac96':
		return redirect('https://knowledgeartist.org/articles/d7e7c832-51bc-4e7d-9684-d822ed91ac96')

	return render(request, 'frontend/index.html')

def ka_newsletter(request):
	return render(request, 'knowledge_artist/newsletter.html')

def ka_music(request):
	return render(request, 'knowledge_artist/music.html')

def ka_drawings(request):
	return render(request, 'knowledge_artist/drawings.html')

def ka_newsletter_post(request, short_url):
	space = Space.objects.filter(short_url=short_url).first()
	if not space or not space.is_public:
		return 	render(request, 'frontend/ka_404.html')

	return render(request, 'frontend/ka_article.html', { 
			'space': space, 
			'html_title': space.html_title, 
			'html_body': serialize_html({ 
				'children': space.json_body }), 
			'book_rating': space.custom_fields.get('book_rating'), 
			'book_amazon_url': space.custom_fields.get('book_amazon_url'),
			'keywords': space.custom_fields.get('meta_keywords'), 
			'description': space.custom_fields.get('meta_description'),
			'show_newsletter_prompt': (not space.custom_fields.get('disable_newsletter_prompt')),
			'is_newsletter': True
		})

def ka_articles(request):
	return render(request, 'frontend/ka_articles.html')

def ka_article_detail(request, pk, slug=None):
	space = Space.objects.get(pk=pk)
	if not space.is_public:
		return 	render(request, 'frontend/ka_404.html')

	if space.short_url:
		return redirect('/article/' + space.short_url)

	return render(request, 'frontend/ka_article.html', { 'space': space, 'html_body': serialize_html({ 'children': space.json_body }), 'keywords': space.custom_fields.get('meta_keywords'), 'description': space.custom_fields.get('meta_description'), 'show_newsletter_prompt': (not space.custom_fields.get('disable_newsletter_prompt')) })

def ka_article_short_url(request, short_url):
	space = Space.objects.filter(short_url=short_url).first()
	if not space or not space.is_public:
		return	render(request, 'frontend/ka_404.html')
	return render(request, 'frontend/ka_article.html', { 
		'space': space, 
		'html_title': space.html_title,
		'html_body': serialize_html({ 'children': space.json_body }), 
		'keywords': space.custom_fields.get('meta_keywords'), 
		'description': space.custom_fields.get('meta_description'), 
		'show_newsletter_prompt': (not space.custom_fields.get('disable_newsletter_prompt'))
		})

def ka_future_of_search(request):
	return redirect('/articles/243ee23e-0dfd-4b94-8b77-0216269b37f6/the-next-frontiers-of-search')
	# return render(request, 'frontend/ka_future_of_search.html')

def wiki_detail(request, pk):
	return render(request, 'frontend/index.html')

def bjj_page(request):
	return redirect('https://combatknowledge.com')
	# return render(request, 'combat_knowledge_site/home.html')
	# host = request.get_host()
	# if host == 'www.getrumin.com' or host == 'getrumin.com':
	# 	return redirect('https://combatknowledge.com/r/bjj')

	# return render(request, 'frontend/index.html')

def new_short_link(request):
	return render(request, 'frontend/index.html')

def activity_detail(request, pk):
	return redirect(reverse('space_detail', kwargs={'pk':pk}))
	# return render(request, 'frontend/activity_detail.html')

def saved_url(request, encoded_url):
	return render(request, 'frontend/index.html')

def demo_graph(request):
	return render(request, 'frontend/index.html')

def demo_log(request):
	return render(request, 'frontend/index.html')

def demo_collection_block(request):
	return render(request, 'frontend/demo_collection_block.html')

def demo_writer(request):
	return render(request, 'frontend/index.html')

def demo_grid_board(request):
	return render(request, 'frontend/index.html')

def demo_mood_board(request):
	return render(request, 'frontend/index.html')

def demo_log_list(request):
	return render(request, 'frontend/index.html')
