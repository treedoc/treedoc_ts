import { TDNode, TDNodeType } from '../../TDNode';
import { TreeDoc } from '../../TreeDoc';

test('testCreateLastNumberOfChildren', () => {
  const node = new TreeDoc().root.setType(TDNodeType.ARRAY);
  const start = new Date().getTime()
  for (let i = 0; i < 1000000; i++) {
    node.createChild("name_" + i).setType(TDNodeType.MAP).createChild("name_" + i + "_1").setValue("value_" + i + "_1");
  }
  expect(node.getChild("name_0")).not.toBeNull();
  const keys = node.getChildrenKeys();
  const time = new Date().getTime() - start;
  console.log(time);
  expect(time).toBeLessThan(5000);
});
