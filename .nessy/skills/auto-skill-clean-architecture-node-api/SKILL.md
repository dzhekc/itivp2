---
name: clean-architecture-node-api
description: How to implement a REST API with Clean Architecture in Node.js/Express when layer structure exists but wiring is incomplete
source: auto-skill
extracted_at: '2026-08-31T18:14:17.197Z'
---

## Approach: Completing a Clean Architecture REST API in Node.js

When the project already has the layer directories (`domain/`, `application/`, `infrastructure/`, `presentation/`) but is missing the wiring (routes, bootstrap, server entry point), follow this procedure:

### 1. Verify existing layers first

Check what already exists before creating anything new:
- **domain/** — entities, repository interfaces (ports), domain errors
- **application/** — use cases, DTOs
- **infrastructure/** — repository implementations, utilities
- **presentation/** — may have middlewares but likely missing routes and app setup

### 2. Create the presentation layer (routes + app)

**Route handler class** (e.g., `ArticleRouter`):
- Accept use cases as constructor dependencies
- Each HTTP method maps to one use case call
- Extract query params as filters, body as DTO
- Use `asyncHandler` middleware to avoid try/catch boilerplate

**App factory** (e.g., `createApp`):
- Create Express instance
- Register JSON/urlencoded middleware
- Mount routers on paths
- Register `notFoundHandler` and `errorHandler` (global)
- Return the app instance

### 3. Create the main/bootstrap layer (DI container)

The bootstrap layer is the glue that wires all layers together. Use a builder-pattern container:

```javascript
class ApplicationContainer {
  build() {
    return this
      .initInfrastructure()   // Create repositories, utilities
      .initUseCases()         // Inject repositories into use cases
      .initPresentation()     // Inject use cases into routers
      .createApp();           // Inject routers into app factory
  }
}
```

Key rules:
- Infrastructure layer creates concrete implementations
- Use cases receive interfaces (or concrete impls — DIP is satisfied by the interface in domain)
- Presentation receives use cases, not repositories
- The container is the only place that knows about concrete types

### 4. Create server.js entry point

```javascript
const container = new ApplicationContainer();
container.build();
const app = container.getApp();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
```

### 5. Common pitfalls to watch for

- **Path resolution**: When importing between layers, calculate paths relative to the importing file's location, not the project root. `src/main/` importing `src/infrastructure/` needs `../infrastructure/...`
- **Module exports mismatch**: Check if something is a `class` (use `new`) or a `function` (use directly). IdGenerator was a function `generateId`, not a class.
- **Use case signature mismatch**: If `UpdateArticle.execute(id, data)` but the route passes `{ id, ...data }`, align the signatures. Better to have use cases accept a single data object.
- **Missing dev dependencies**: Ensure `nodemon` is installed for `npm run dev`

### 6. Test all endpoints

After wiring, test every endpoint:
- `GET /health` — server is running
- `GET /resource` — list with optional filters
- `GET /resource/:id` — single item
- `POST /resource` — create with valid data
- `PUT /resource/:id` — update
- `DELETE /resource/:id` — delete (204)
- `GET /resource/:id` (nonexistent) — 404 error
- `POST /resource` (invalid data) — 400 validation error

### Dependency direction (Clean Architecture rule)

```
presentation → use-cases → repository interfaces (domain)
infrastructure → implements repository interfaces
```

No layer should import from a layer "below" it. The DI container at `main/` is the composition root — the only place that breaks this rule by wiring concrete types together.
