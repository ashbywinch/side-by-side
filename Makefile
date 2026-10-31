SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

NPM := npm
NODE := node

.PHONY: help setup install-hooks dev data check-corpus lint typecheck check test coverage format clean dist smoke release

help:
	@printf '%s\n' \
	  'Side by Side — development and release targets' \
	  '' \
	  '  make setup           install dependencies, .env, git hooks' \
	  '  make dev             build corpus + Vite on :8080' \
	  '  make data            rebuild the chunked corpus in public/api' \
	  '  make check-corpus    validate corpus parity and translations' \
	  '  make lint            eslint' \
	  '  make typecheck       vue-tsc' \
	  '  make check           lint + typecheck (pre-push gate)' \
	  '  make test            check + tests with coverage' \
	  '  make coverage        tests with coverage only' \
	  '  make format          prettier write' \
	  '  make dist            production build in dist/' \
	  '  make clean           remove node_modules, coverage, dist, generated corpus' \
	  '  make smoke ARGS=...  run scripts/smoke.mjs' \
	  '  make release VERSION=x.y.z  dispatch the gated semver release workflow'

setup:
	$(NPM) ci
	[ -f .env ] || cp .env.example .env
	$(NPM) run prepare

install-hooks:
	$(NPM) run prepare

dev:
	$(NPM) run dev

data:
	$(NPM) run data

check-corpus:
	$(NPM) run check-corpus

lint:
	$(NPM) run lint

typecheck:
	$(NPM) run typecheck

check: lint typecheck

test: lint typecheck check-corpus coverage

coverage:
	$(NPM) run coverage

format:
	$(NPM) run format

clean:
	rm -rf node_modules coverage dist public/api

dist:
	$(NPM) run build

smoke:
	$(NODE) scripts/smoke.mjs $(ARGS)

release:
	@test -n "$(VERSION)" || (echo "usage: make release VERSION=x.y.z" >&2; exit 1)
	gh workflow run release.yml --repo ashbywinch/side-by-side -f version=$(VERSION)
	@echo "Release dispatched. Watch the CI run; approve the production deployment when the green smoke passes."
