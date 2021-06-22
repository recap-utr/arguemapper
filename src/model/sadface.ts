import { v1 as uuid } from 'uuid';

const VERSION = '0.1';

class Parent {
  constructor(public metadata: Metadata) {}

  update() {
    this.metadata.updated = new Date();
  }
}

class Graph extends Parent {
  constructor(
    public id: string,
    public inodes: Record<string, INode>,
    public snodes: Record<string, SNode>,
    public edges: Record<string, Edge>,
    public resources: Array<Resource>,
    public metadata: Metadata,
    public version: string,
    public majorClaim?: INode
  ) {
    super(metadata);
  }

  get nodes(): Record<string, Node> {
    return { ...this.inodes, ...this.snodes };
  }

  static create(): Graph {
    return new Graph(uuid(), {}, {}, {}, [], Metadata.create(), VERSION);
  }

  toCytoscape() {
    const inodes = Object.values(this.inodes).map((x) =>
      x.toCytoscape()
    ) as Array<any>;
    const snodes = Object.values(this.snodes).map((x) =>
      x.toCytoscape()
    ) as Array<any>;
    const edges = Object.values(this.edges).map((x) =>
      x.toCytoscape()
    ) as Array<any>;

    return {
      data: {
        id: this.id,
      },
      elements: {
        nodes: inodes.concat(snodes),
        edges: edges,
      },
    };
  }

  toJSON() {
    return {
      analyst: Analyst.create('', ''),
    };
  }

  addINode(text: string): Node {
    const node = INode.create(text);
    this.inodes[node.id] = node;

    return node;
  }

  addSNode(type: NodeType, scheme?: SchemeType): Node {
    const node = SNode.create(type, scheme);
    this.snodes[node.id] = node;

    return node;
  }

  addEdge(source: Node, target: Node): Edge {
    const edge = Edge.create(source, target);
    this.edges[edge.id] = edge;

    return edge;
  }

  removeNode(id: string) {
    delete this.inodes[id];
    delete this.snodes[id];

    const filteredEdges = Object.entries(this.edges).filter(
      ([{}, edge]) => edge.source.id == id || edge.target.id == id
    );
    filteredEdges.forEach(([edgeId, {}]) => delete this.edges[edgeId]);
  }

  removeEdge(id: string) {
    delete this.edges[id];
  }
}

interface Node {
  id: string;
  metadata: Metadata;
}

class INode extends Parent implements Node {
  constructor(
    public id: string,
    public text: string,
    public metadata: Metadata,
    public resources: Array<NodeResource> = []
  ) {
    super(metadata);
  }

  static create(text: string): INode {
    return new INode(uuid(), text, Metadata.create());
  }

  toCytoscape() {
    return {
      data: {
        id: this.id,
        text: this.text,
      },
    };
  }
}

interface NodeResource {
  resource: Resource;
  text: string;
  offset: number;
}

class SNode extends Parent implements Node {
  constructor(
    public id: string,
    public metadata: Metadata,
    public type: NodeType,
    public scheme?: SchemeType
  ) {
    super(metadata);
  }

  static create(type: NodeType, scheme?: SchemeType) {
    return new SNode(uuid(), Metadata.create(), type, scheme);
  }

  toCytoscape() {
    return {
      data: {
        id: this.id,
      },
    };
  }
}

enum NodeType {
  // I = 'I',
  // L = 'L',
  RA = 'RA',
  CA = 'CA',
  MA = 'MA',
  TA = 'TA',
  PA = 'PA',
  YA = 'YA',
}

// https://stackoverflow.com/a/57462517/7626878
enum SchemeType {
  TODO = 'TODO',
}

class Edge extends Parent {
  constructor(
    public id: string,
    public source: Node,
    public target: Node,
    public metadata: Metadata
  ) {
    super(metadata);
  }

  static create(source: Node, target: Node): Edge {
    return new Edge(uuid(), source, target, Metadata.create());
  }

  toCytoscape() {
    return {
      data: {
        id: this.id,
        source: this.source.id,
        target: this.target.id,
      },
    };
  }
}

class Resource extends Parent {
  constructor(
    public id: string,
    public text: string,
    public metadata: Metadata,
    public title?: string,
    public source?: string,
    public date?: Date
  ) {
    super(metadata);
  }

  static create(text: string): Resource {
    return new Resource(uuid(), text, Metadata.create());
  }
}

class Metadata {
  constructor(public created: Date, public updated: Date) {}

  static create(): Metadata {
    const date = new Date();
    return new Metadata(date, date);
  }
}

class Analyst {
  constructor(public name: string, public email: string) {}

  static create(name: string, email: string): Analyst {
    return new Analyst(name, email);
  }
}
