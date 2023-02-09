export interface DesiredResource {
  id: string;
  type?: string;
  name?: string;
  fieldData: { [property: string]: any };
}
