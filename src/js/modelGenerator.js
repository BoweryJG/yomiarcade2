import * as THREE from 'three';
import { mergeGeometries } from 'three-stdlib';

export class ModelGenerator {
  constructor() {
    this.materials = this.createMaterials();
  }

  createMaterials() {
    // Enhanced tooth material with realistic enamel
    const toothMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFF8,
      metalness: 0.05,
      roughness: 0.15,
      transmission: 0.2,
      thickness: 1.5,
      envMapIntensity: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      sheen: 0.5,
      sheenRoughness: 0.2,
      sheenColor: new THREE.Color(0xFFFFF0),
      ior: 1.6,
      iridescence: 0.3,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 400],
    });

    // Realistic gum material
    const gumMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFB5B5,
      metalness: 0,
      roughness: 0.7,
      clearcoat: 0.4,
      clearcoatRoughness: 0.6,
      sheen: 0.3,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color(0xFFAAAA),
      transmission: 0.05,
      thickness: 0.5,
    });

    // Bone material with texture
    const boneMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFE4C4,
      metalness: 0,
      roughness: 0.85,
      bumpScale: 0.01,
      clearcoat: 0.1,
      clearcoatRoughness: 0.9,
    });

    // Premium titanium implant material
    const implantMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xE8E8E8,
      metalness: 0.95,
      roughness: 0.15,
      envMapIntensity: 1.5,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
    });

    // High-tech drill material
    const drillMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3A3A3A,
      metalness: 1,
      roughness: 0.05,
      envMapIntensity: 2,
      clearcoat: 1,
      clearcoatRoughness: 0,
    });

    // Cavity material
    const cavityMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4A4A4A,
      metalness: 0.1,
      roughness: 0.9,
      opacity: 0.85,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Plaque material
    const plaqueMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFEE99,
      metalness: 0,
      roughness: 0.6,
      opacity: 0.75,
      transparent: true,
      side: THREE.DoubleSide,
      transmission: 0.1,
    });

    // Fluoride treatment material
    const fluorideMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00CED1,
      metalness: 0.2,
      roughness: 0.3,
      opacity: 0.6,
      transparent: true,
      transmission: 0.4,
      thickness: 0.5,
      emissive: 0x00CED1,
      emissiveIntensity: 0.2,
    });

    // Gold crown material
    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFD700,
      metalness: 1,
      roughness: 0.2,
      envMapIntensity: 2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });

    return {
      tooth: toothMaterial,
      gum: gumMaterial,
      bone: boneMaterial,
      implant: implantMaterial,
      drill: drillMaterial,
      cavity: cavityMaterial,
      plaque: plaqueMaterial,
      fluoride: fluorideMaterial,
      gold: goldMaterial,
    };
  }

  createTooth(type = 'molar', size = 1) {
    const group = new THREE.Group();
    
    // Crown
    const crownGeometry = this.createCrownGeometry(type, size);
    const crown = new THREE.Mesh(crownGeometry, this.materials.tooth);
    crown.castShadow = true;
    crown.receiveShadow = true;
    
    // Root
    const rootGeometry = this.createRootGeometry(type, size);
    const root = new THREE.Mesh(rootGeometry, this.materials.tooth);
    root.position.y = -size * 0.5;
    
    group.add(crown);
    group.add(root);
    
    return group;
  }

  createCrownGeometry(type, size) {
    let geometry;
    
    switch (type) {
      case 'molar':
        // Create molar with cusps
        const baseGeometry = new THREE.CylinderGeometry(
          size * 0.4, 
          size * 0.35, 
          size * 0.6, 
          8
        );
        
        // Add cusps
        const cuspGeometry = new THREE.SphereGeometry(size * 0.15, 8, 8);
        const cusps = [];
        
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const cusp = cuspGeometry.clone();
          cusp.translate(
            Math.cos(angle) * size * 0.2,
            size * 0.3,
            Math.sin(angle) * size * 0.2
          );
          cusps.push(cusp);
        }
        
        geometry = mergeGeometries([baseGeometry, ...cusps]);
        break;
        
      case 'premolar':
        geometry = new THREE.CylinderGeometry(
          size * 0.3,
          size * 0.25,
          size * 0.7,
          6
        );
        break;
        
      case 'incisor':
        geometry = new THREE.BoxGeometry(
          size * 0.15,
          size * 0.8,
          size * 0.3
        );
        break;
        
      default:
        geometry = new THREE.CylinderGeometry(
          size * 0.35,
          size * 0.3,
          size * 0.6,
          8
        );
    }
    
    // Add some irregularity
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setY(
        i,
        positions.getY(i) + (Math.random() - 0.5) * size * 0.02
      );
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }

  createRootGeometry(type, size) {
    const rootCount = type === 'molar' ? 3 : type === 'premolar' ? 2 : 1;
    const roots = [];
    
    for (let i = 0; i < rootCount; i++) {
      const rootGeometry = new THREE.ConeGeometry(
        size * 0.1,
        size * 0.8,
        6
      );
      
      if (rootCount > 1) {
        const angle = (i / rootCount) * Math.PI * 2;
        rootGeometry.translate(
          Math.cos(angle) * size * 0.1,
          0,
          Math.sin(angle) * size * 0.1
        );
      }
      
      roots.push(rootGeometry);
    }
    
    return rootCount > 1 ? mergeGeometries(roots) : roots[0];
  }

  createJaw(isUpper = false) {
    const group = new THREE.Group();
    
    // Jaw bone base
    const jawCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 0, 2),
      new THREE.Vector3(-3, 0, 3.5),
      new THREE.Vector3(0, 0, 4),
      new THREE.Vector3(3, 0, 3.5),
      new THREE.Vector3(4, 0, 2),
    ]);
    
    const jawShape = new THREE.Shape();
    jawShape.moveTo(0, -1);
    jawShape.lineTo(0.5, -0.8);
    jawShape.lineTo(0.8, 0);
    jawShape.lineTo(0.5, 0.8);
    jawShape.lineTo(0, 1);
    jawShape.lineTo(-0.5, 0.8);
    jawShape.lineTo(-0.8, 0);
    jawShape.lineTo(-0.5, -0.8);
    
    const extrudeSettings = {
      steps: 100,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 8,
      extrudePath: jawCurve,
    };
    
    const jawGeometry = new THREE.ExtrudeGeometry(jawShape, extrudeSettings);
    const jawBone = new THREE.Mesh(jawGeometry, this.materials.bone);
    jawBone.castShadow = true;
    jawBone.receiveShadow = true;
    group.add(jawBone);
    
    // Gum tissue
    const gumGeometry = jawGeometry.clone();
    gumGeometry.scale(1.1, 1.2, 1.1);
    const gumMesh = new THREE.Mesh(gumGeometry, this.materials.gum);
    gumMesh.position.y = 0.2;
    group.add(gumMesh);
    
    // Add teeth sockets
    const toothPositions = this.getToothPositions(isUpper);
    toothPositions.forEach((pos, index) => {
      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.12, 0.3, 8),
        this.materials.bone
      );
      socket.position.copy(pos);
      socket.position.y = 0.5;
      group.add(socket);
    });
    
    if (isUpper) {
      group.rotation.x = Math.PI;
      group.position.y = 3;
    }
    
    return group;
  }

  getToothPositions(isUpper = false) {
    const positions = [];
    const radius = 3.5;
    const toothCount = 14; // 7 per side
    
    for (let i = 0; i < toothCount; i++) {
      const angle = (i / toothCount) * Math.PI - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius + 1;
      const y = 0;
      
      positions.push(new THREE.Vector3(x, y, z));
    }
    
    return positions;
  }

  createImplant(length = 2) {
    const group = new THREE.Group();
    
    // Implant body with threads
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.15, length, 16);
    const body = new THREE.Mesh(bodyGeometry, this.materials.implant);
    
    // Add thread spiral
    const threadCurve = new THREE.Curve();
    threadCurve.getPoint = function(t) {
      const height = t * length - length / 2;
      const angle = t * Math.PI * 2 * 8; // 8 rotations
      const radius = 0.22;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    };
    
    const threadGeometry = new THREE.TubeGeometry(threadCurve, 100, 0.02, 8, false);
    const thread = new THREE.Mesh(threadGeometry, this.materials.implant);
    
    // Abutment
    const abutmentGeometry = new THREE.ConeGeometry(0.25, 0.5, 8);
    const abutment = new THREE.Mesh(abutmentGeometry, this.materials.implant);
    abutment.position.y = length / 2 + 0.25;
    
    group.add(body);
    group.add(thread);
    group.add(abutment);
    
    return group;
  }

  createDrill() {
    const group = new THREE.Group();
    
    // Drill shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 16);
    const shaft = new THREE.Mesh(shaftGeometry, this.materials.drill);
    shaft.position.y = 1.5;
    
    // Drill bit with flutes
    const bitGeometry = new THREE.ConeGeometry(0.1, 1, 4);
    const bit = new THREE.Mesh(bitGeometry, this.materials.drill);
    
    // Add flutes (spiral grooves)
    const fluteGeometry = new THREE.TorusGeometry(0.08, 0.02, 4, 20);
    for (let i = 0; i < 3; i++) {
      const flute = new THREE.Mesh(fluteGeometry, this.materials.drill);
      flute.position.y = -0.3 + i * 0.3;
      flute.rotation.x = Math.PI / 2;
      flute.rotation.z = i * Math.PI / 3;
      group.add(flute);
    }
    
    group.add(shaft);
    group.add(bit);
    
    return group;
  }

  createTargetMarker() {
    const group = new THREE.Group();
    
    // Outer ring
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.05, 8, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.8 
      })
    );
    
    // Inner ring
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.03, 8, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.6 
      })
    );
    
    // Center dot
    const centerDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    
    // Crosshair lines
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.4
    });
    
    const points1 = [
      new THREE.Vector3(-0.5, 0, 0),
      new THREE.Vector3(0.5, 0, 0)
    ];
    const points2 = [
      new THREE.Vector3(0, 0, -0.5),
      new THREE.Vector3(0, 0, 0.5)
    ];
    
    const line1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points1),
      lineMaterial
    );
    const line2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points2),
      lineMaterial
    );
    
    group.add(outerRing);
    group.add(innerRing);
    group.add(centerDot);
    group.add(line1);
    group.add(line2);
    
    return group;
  }

  createParticleSystem(type = 'bone') {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      if (type === 'bone') {
        color.setHSL(0.1, 0.3, 0.8 + Math.random() * 0.2);
      } else if (type === 'blood') {
        color.setHSL(0, 0.8, 0.5 + Math.random() * 0.2);
      } else {
        color.setHSL(0.6, 0.1, 0.9);
      }
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.05 + 0.01;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    return new THREE.Points(geometry, material);
  }
}