import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatNumber } from '../../utils/format.js';

export default function TopCategoriesChart({ data }) {
  if (!data?.length) {
    return <p className="py-8 text-center text-sm text-slate-500">Немає витрат за період</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
          {data.map((d) => <Cell key={d.categoryId} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v) => formatNumber(v) + ' ₴'} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
