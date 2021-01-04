import { DEFAULT_SCALARS } from "@graphql-codegen/visitor-plugin-common";
import autoBind from "auto-bind";
import { FieldDefinitionNode, GraphQLSchema, ObjectTypeDefinitionNode, ScalarTypeDefinitionNode } from "graphql";
import { OperationType, PluginContext } from "./types";

/**
 * Graphql-codegen visitor for processing the ast and generating fragments
 */
export class ContextVisitor {
  private _schema: GraphQLSchema;
  private _scalars: typeof DEFAULT_SCALARS = DEFAULT_SCALARS;
  private _objects: ObjectTypeDefinitionNode[] = [];
  private _queries: readonly FieldDefinitionNode[] = [];

  /** Initialize the visitor */
  public constructor(schema: GraphQLSchema) {
    autoBind(this);

    this._schema = schema;
  }

  /**
   * Return a context object for recording state
   */
  public get context(): Omit<PluginContext, "fragments"> {
    return {
      schema: this._schema,
      scalars: this._scalars,
      objects: this._objects,
      queries: this._queries,
      operationMap: {
        [OperationType.query]: this._schema.getQueryType()?.name ?? "Query",
        [OperationType.mutation]: this._schema.getMutationType()?.name ?? "Mutation",
      },
    };
  }

  public ScalarTypeDefinition = {
    /** Record all scalars */
    enter: (node: ScalarTypeDefinitionNode): ScalarTypeDefinitionNode => {
      this._scalars = { ...this._scalars, [node.name.value]: node.name.value };
      return node;
    },
  };

  public ObjectTypeDefinition = {
    /** Record all object types */
    enter: (node: ObjectTypeDefinitionNode): ObjectTypeDefinitionNode => {
      this._objects = [...this._objects, node];

      if (node.name.value === this.context.operationMap[OperationType.query]) {
        /** Record all queries */
        this._queries = node.fields ?? [];
      }

      return node;
    },
  };
}
