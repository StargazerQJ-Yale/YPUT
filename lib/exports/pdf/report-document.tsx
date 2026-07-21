import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#52514e", marginBottom: 16 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, gap: 24 },
  summaryItem: { marginRight: 24 },
  summaryLabel: { fontSize: 8, color: "#898781", textTransform: "uppercase" },
  summaryValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  table: { borderTopWidth: 1, borderTopColor: "#e1e0d9" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e0d9",
    paddingVertical: 5,
  },
  headerRow: { backgroundColor: "#f9f9f7" },
  cell: { flex: 1, paddingHorizontal: 4 },
  headerCell: { flex: 1, paddingHorizontal: 4, fontWeight: 700 },
  footer: { position: "absolute", bottom: 16, left: 32, right: 32, fontSize: 8, color: "#898781" },
});

export type ReportSection = {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
};

export type ReportDocumentProps = {
  orgName: string;
  title: string;
  subtitle: string;
  summary?: { label: string; value: string }[];
  sections: ReportSection[];
};

function ReportDocument({ orgName, title, subtitle, summary, sections }: ReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {summary && summary.length > 0 && (
          <View style={styles.summaryRow}>
            {summary.map((item) => (
              <View key={item.label} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            <View style={styles.table}>
              <View style={[styles.row, styles.headerRow]}>
                {section.headers.map((header) => (
                  <Text key={header} style={styles.headerCell}>
                    {header}
                  </Text>
                ))}
              </View>
              {section.rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((cell, cellIndex) => (
                    <Text key={cellIndex} style={styles.cell}>
                      {String(cell)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer} fixed>
          {orgName} — generated {new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(props: ReportDocumentProps): Promise<Buffer> {
  return renderToBuffer(<ReportDocument {...props} />);
}
