build-ApiFunction:
	cp main.py db.py db_dynamo.py db_sqlite.py geo.py scraper.py lambda_handler.py "$(ARTIFACTS_DIR)/"

build-ScraperFunction:
	cp main.py db.py db_dynamo.py db_sqlite.py geo.py scraper.py lambda_handler.py "$(ARTIFACTS_DIR)/"

build-DepsLayer:
	cp -r .layer-build/python "$(ARTIFACTS_DIR)/"
