(function() {
	"use strict";

	var Particle = function(x, y, initialVel, gravityVec, lifetime, color, size) {
		this.pos = new Vector(x, y, -1);
		this.vel = initialVel ? initialVel : new Vector(0, 0, 0);

		this.lifetime = lifetime;
		this.created = Date.now();

		this.gravity = gravityVec ? gravityVec : new Vector(0, 0, 0);

		this.alive = true;

		this.color = color ? color : [1.0, 1.0, 1.0, 1.0];
		this.size = size ? size : 1.0;
	};

	Particle.prototype.revive = function(pos, vel, lifetime, gravity, color, size) {
		this.pos = pos ? pos : new Vector(0, 0, 0);
		this.vel = vel ? vel : new Vector(0, 0, 0);

		this.lifetime = lifetime;
		this.created = Date.now();

		this.gravity = gravity ? gravity : new Vector(0, 0, 0);

		this.color = color ? color : [1.0, 1.0, 1.0, 1.0];

		this.size = size ? size : 1.0;

		this.alive = true;
	};

	Particle.prototype.update = function(dt) {
		this.vel.add(this.gravity.clone().mul(dt / 1000));
		this.pos.add(this.vel.clone().mul(dt / 1000));
	};

	Particle.prototype.draw = function(ctx) {
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(this.pos.i, this.pos.j, 1, 1);
	};





	var ParticleEmitter = function(x, y, rate, amount, lifetime, gravityVec, direction, settings) {
		this.pos = new Vector(x, y, -1);

		this.rate = rate;
		this.lastEmit = 0;

		this.amount = amount;

		this.lifetime = lifetime;
		this.created = Date.now();
		this.alive = true;

		this.gravity = gravityVec ? gravityVec : new Vector(0, 0, 0);

		this.direction = direction ? direction : new Vector(1, 0, 0);
		this.direction.normalize();


		this.options = {
			lifetime: 1000,
			lifeScatter: 200,

			angleScatter: Math.PI * 2,

			power: 2,
			powerScatter: 2,

			minSize: 2.0,
			maxSize: 2.0,

			minR: 1.0,
			minG: 1.0,
			minB: 1.0,
			minA: 1.0,

			maxR: 1.0,
			maxG: 1.0,
			maxB: 1.0,
			maxA: 1.0
		};

		if (settings) {
			$.extend(this.options, settings);
		}
	};

	ParticleEmitter.prototype.setPosition = function(x, y, z) {
		this.pos.set(x, y, z);
	};

	ParticleEmitter.prototype.move = function(d) {
		this.pos.add(d);
	};

	ParticleEmitter.prototype.update = function(particleSystem, dt) {
		if (Date.now() > this.lastEmit + this.rate) {
			for (var i = 0; i < this.amount; i++) {
				var newParticle = particleSystem.pool.pop();

				if (typeof newParticle === "undefined") {
					newParticle = new Particle(0, 0, null, null, 0);
					particleSystem.particles.push(newParticle);
				}


				var power = rand(this.options.power - this.options.powerScatter / 2, this.options.power + this.options.powerScatter / 2),
					angleScatter = rand(-this.options.angleScatter / 2, this.options.angleScatter / 2),
					newVel = this.direction.clone().rotate(angleScatter).mul(power),
					size = rand(this.options.minSize, this.options.maxSize),
					life = rand(this.options.lifetime - this.options.lifeScatter / 2, this.options.lifetime + this.options.lifeScatter / 2),
					color = [
						rand(this.options.minR, this.options.maxR),
						rand(this.options.minG, this.options.maxG),
						rand(this.options.minB, this.options.maxB),
						rand(this.options.minA, this.options.maxA)
					];

				newParticle.revive(this.pos.clone(), newVel, life, this.gravity, color, size);
			}

			this.lastEmit = Date.now();	
		}
	};






	var ParticleSystem = function() {
		this.pool = [];
		this.particles = [];

		this.emitters = [];

		this.vertices = [];
		this.colors = [];
		this.sizes = [];
	};

	ParticleSystem.prototype.addEmitter = function(emitter) {
		this.emitters.push(emitter);
	};

	ParticleSystem.prototype.update = function(dt, ctx) {
		this.vertices = [];
		this.colors = [];
		this.sizes = [];

		for (var i = 0; i < this.emitters.length; i++) {
			this.emitters[i].update(this, dt);

			if (this.emitters[i].lifetime >= 0 && Date.now() > this.emitters[i].created + this.emitters[i].lifetime) {
				this.emitters[i].alive = false;
			}
		}

		this.emitters = this.emitters.filter(function(elem) {
			return elem.alive;
		});

		for (var i = 0; i < this.particles.length; i++) {
			var particle = this.particles[i];

			if (!particle.alive) {
				continue;
			}

			particle.update(dt);
			// particle.draw(ctx);

			if (Date.now() > (particle.created + particle.lifetime)) {
				this.pool.push(particle);
				particle.alive = false;
			} else {
				this.vertices = this.vertices.concat(particle.pos.toArray());
				this.colors = this.colors.concat(particle.color);
				this.sizes.push(particle.size);
			}

			
		}
	};



	function rand(min, max) {
		if (min > max) {
			var tmp = min;
			min = max;
			max = tmp;
		}


		return min + (max - min) * Math.random();
	}

	window.Particle = Particle;
	window.ParticleEmitter = ParticleEmitter;
	window.ParticleSystem = ParticleSystem;
})();