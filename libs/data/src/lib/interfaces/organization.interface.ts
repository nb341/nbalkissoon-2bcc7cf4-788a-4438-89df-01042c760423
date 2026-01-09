export interface IOrganization {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: IOrganization;
  children?: IOrganization[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizationTree extends IOrganization {
  children: IOrganizationTree[];
  level: number;
}
