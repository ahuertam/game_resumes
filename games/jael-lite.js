
export class World {
    constructor() {
        this.entities = new Set();
        this.components = new Map(); // Map<ComponentType, Map<EntityId, ComponentData>>
        this.systems = [];
        this.nextEntityId = 0;
        this.events = {};
        this.queries = new Map(); // Cache for queries
    }

    create() {
        const id = this.nextEntityId++;
        this.entities.add(id);
        this.emit('entityCreated', { entityId: id });
        return id;
    }

    destroy(entityId) {
        this.entities.delete(entityId);
        for (const [type, store] of this.components) {
            if (store.has(entityId)) {
                store.delete(entityId);
                this.emit('componentRemoved', { entityId, component: type });
            }
        }
        this.emit('entityDestroyed', { entityId });
    }

    addComponent(entityId, type, data) {
        if (!this.components.has(type)) {
            this.components.set(type, new Map());
        }
        this.components.get(type).set(entityId, { ...data });
        this.emit('componentAdded', { entityId, component: type });
    }

    removeComponent(entityId, type) {
        if (this.components.has(type)) {
            this.components.get(type).delete(entityId);
            this.emit('componentRemoved', { entityId, component: type });
        }
    }

    getComponent(entityId, type) {
        return this.components.get(type)?.get(entityId);
    }

    // Entity Proxy for convenience (mimics Jael's entity.get/add)
    getEntity(entityId) {
        if (!this.entities.has(entityId)) return null;
        return {
            id: entityId,
            add: (type, data) => this.addComponent(entityId, type, data),
            remove: (type) => this.removeComponent(entityId, type),
            get: (type) => this.getComponent(entityId, type),
            has: (type) => this.components.get(type)?.has(entityId) || false
        };
    }

    addSystem(system) {
        this.systems.push(system);
        this.systems.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    }

    include(...componentTypes) {
        // Simple query implementation
        // In a real ECS, this would be cached and optimized with SparseSets or Bitmasks
        const key = componentTypes.sort().join('|');
        
        // For this lite version, we re-evaluate every frame to keep it simple and robust without complex cache invalidation logic
        // But to mimic API, we return an object with an 'entities' array
        const entities = [];
        for (const entityId of this.entities) {
            let hasAll = true;
            for (const type of componentTypes) {
                if (!this.components.get(type)?.has(entityId)) {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) {
                entities.push(this.getEntity(entityId));
            }
        }
        return { entities };
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(cb => cb(data));
        }
    }

    update(delta) {
        Time.delta = delta;
        this.emit('updated', null);
        for (const system of this.systems) {
            system.update(this, delta);
        }
    }
}

export const Time = {
    delta: 0
};
