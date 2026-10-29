import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Brand Colors
    c_dark_green = RGBColor(22, 101, 52)     # #166534
    c_forest = RGBColor(27, 77, 62)          # #1B4D3E
    c_teal = RGBColor(15, 118, 110)          # #0F766E
    c_light_bg = RGBColor(251, 251, 250)     # #FBFBFA
    c_card_bg = RGBColor(255, 255, 255)
    c_card_border = RGBColor(226, 232, 240)
    c_text_dark = RGBColor(15, 23, 42)       # Slate 900
    c_text_muted = RGBColor(100, 116, 139)   # Slate 500
    c_white = RGBColor(255, 255, 255)
    c_accent_gold = RGBColor(217, 119, 6)

    def add_header(slide, title, category="SAKEC AIDS • DATA STRUCTURES & ALGORITHMS MICROPROJECT"):
        # Top accent bar
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
        bar.fill.solid()
        bar.fill.fore_color.rgb = c_dark_green
        bar.line.color.rgb = c_dark_green

        # Category Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.5), Inches(0.3))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = c_teal

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = c_text_dark

    def add_card(slide, left, top, width, height, title="", bg_color=c_card_bg, border_color=c_card_border):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)
        
        if title:
            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), Inches(0.5))
            tf = tb.text_frame
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(14)
            p.font.bold = True
            p.font.color.rgb = c_dark_green
        return card

    # ========================================================
    # SLIDE 1: TITLE SLIDE
    # ========================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = c_forest
    bg1.line.color.rgb = c_forest

    t_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.6), Inches(11), Inches(4.5))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "SHAH & ANCHOR KUTCHHI ENGINEERING COLLEGE (SAKEC)"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(167, 243, 208)

    p1 = tf1.add_paragraph()
    p1.text = "Department of Artificial Intelligence & Data Science"
    p1.font.size = Pt(12)
    p1.font.color.rgb = RGBColor(209, 250, 229)
    p1.space_after = Pt(24)

    p2 = tf1.add_paragraph()
    p2.text = "FOOD RESCUE"
    p2.font.size = Pt(44)
    p2.font.bold = True
    p2.font.color.rgb = c_white

    p3 = tf1.add_paragraph()
    p3.text = "Smart Expiry-Time Matching & Redistribution System"
    p3.font.size = Pt(22)
    p3.font.color.rgb = RGBColor(167, 243, 208)
    p3.space_after = Pt(28)

    p4 = tf1.add_paragraph()
    p4.text = "DSA Microproject • Min-Heap | Dijkstra's Shortest Path | Hash Tables | C++17 Core"
    p4.font.size = Pt(13)
    p4.font.color.rgb = c_white

    # ========================================================
    # SLIDE 2: PROBLEM STATEMENT & MOTIVATION
    # ========================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Problem Statement & Project Motivation")

    add_card(s2, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0), "1. The Food Waste Crisis")
    tb2_1 = s2.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(3.2), Inches(4.0))
    tf2_1 = tb2_1.text_frame
    tf2_1.word_wrap = True
    items2_1 = [
        "Massive urban food wastage from restaurants, banquet halls, and canteens.",
        "Over 40% of prepared perishable surplus ends up in landfills due to delayed dispatch.",
        "Generates methane emissions accelerating climate degradation."
    ]
    for it in items2_1:
        p = tf2_1.add_paragraph()
        p.text = "• " + it
        p.font.size = Pt(12)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(12)

    add_card(s2, Inches(4.85), Inches(1.8), Inches(3.6), Inches(5.0), "2. The Urgency Bottleneck")
    tb2_2 = s2.shapes.add_textbox(Inches(5.05), Inches(2.5), Inches(3.2), Inches(4.0))
    tf2_2 = tb2_2.text_frame
    tf2_2.word_wrap = True
    items2_2 = [
        "Perishable cooked meals spoil within 3 to 6 hours if not consumed quickly.",
        "Conventional charity redistribution relies on slow manual telephone coordination.",
        "No dynamic priority queues to dispatch earliest expiring surplus first."
    ]
    for it in items2_2:
        p = tf2_2.add_paragraph()
        p.text = "• " + it
        p.font.size = Pt(12)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(12)

    add_card(s2, Inches(8.9), Inches(1.8), Inches(3.6), Inches(5.0), "3. Algorithmic Solution")
    tb2_3 = s2.shapes.add_textbox(Inches(9.1), Inches(2.5), Inches(3.2), Inches(4.0))
    tf2_3 = tb2_3.text_frame
    tf2_3.word_wrap = True
    items2_3 = [
        "Automated resource allocation matching donors with eligible shelters/food banks.",
        "Dijkstra's shortest path minimises urban transit delays across Mumbai roads.",
        "Zero Hunger (SDG 2) & Responsible Consumption (SDG 12) aligned."
    ]
    for it in items2_3:
        p = tf2_3.add_paragraph()
        p.text = "• " + it
        p.font.size = Pt(12)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(12)

    # ========================================================
    # SLIDE 3: SYSTEM ARCHITECTURE & TECH STACK
    # ========================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "System Architecture & End-to-End Tech Stack")

    # Layer 1: Frontend
    add_card(s3, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0), "Frontend (User Interface)")
    tb3_1 = s3.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(3.2), Inches(4.0))
    tf3_1 = tb3_1.text_frame
    tf3_1.word_wrap = True
    items3_1 = [
        "React 18 with TypeScript & Vite.",
        "Tailwind CSS with clean sustainability aesthetic (Forest Green & Teal).",
        "Recharts for real-time inventory and fulfillment analytics.",
        "Native Interactive SVG Weighted Road Graph with path highlighting.",
        "Lucide Icons & Toast Notifications."
    ]
    for it in items3_1:
        p = tf3_1.add_paragraph()
        p.text = "✔ " + it
        p.font.size = Pt(12)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(10)

    # Layer 2: C++ Backend
    add_card(s3, Inches(4.85), Inches(1.8), Inches(3.6), Inches(5.0), "Backend (C++17 DSA Core)")
    tb3_2 = s3.shapes.add_textbox(Inches(5.05), Inches(2.5), Inches(3.2), Inches(4.0))
    tf3_2 = tb3_2.text_frame
    tf3_2.word_wrap = True
    items3_2 = [
        "Compiled native binary (GCC 16.2 / C++17).",
        "Lightweight HTTP framework (cpp-httplib) with CORS support.",
        "Standard JSON serialization (nlohmann/json).",
        "Pure C++ DSA algorithms (no JavaScript mockups).",
        "Deterministic Min-Heap, Dijkstra, and Hash Tables."
    ]
    for it in items3_2:
        p = tf3_2.add_paragraph()
        p.text = "✔ " + it
        p.font.size = Pt(12)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(10)

    # Layer 3: Database
    add_card(s3, Inches(8.9), Inches(1.8), Inches(3.6), Inches(5.0), "Database (SQLite Persistence)")
    tb3_3 = s3.shapes.add_textbox(Inches(9.1), Inches(2.5), Inches(3.2), Inches(4.0))
    tf3_3 = tb3_3.text_frame
    tf3_3.word_wrap = True
    items3_3 = [
        "Embedded SQLite3 database (food_rescue.db).",
        "Prepared SQL statements preventing injection attacks.",
        "Tables: donations, recipients, graph_edges, allocations.",
        "ACID Transactions (BEGIN ... COMMIT) with automatic rollback on failure.",
        "Audit trail protection for historic records."
    ]
    for it in items3_3:
        p = tf3_3.add_paragraph()
        p.text = "✔ " + it
        p.font.size = Pt(12)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(10)

    # ========================================================
    # SLIDE 4: CORE DSA ENGINE OVERVIEW
    # ========================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Core Data Structures & Algorithmic Foundations")

    cards_dsa = [
        ("1. Hash Tables", "std::unordered_map", "O(1) Average Lookup", [
            "Manages donations and recipient NGOs by unique IDs (D001, R001).",
            "Eliminates duplicate submissions via hash-bucket indexing.",
            "Instant cache synchronization between SQLite and RAM."
        ]),
        ("2. Min-Heap Priority Queue", "ExpiryMinHeap", "O(log N) Priority Pop", [
            "Binary tree where parent expiry <= child expiry.",
            "Primary sorting: earliest UNIX expiration epoch.",
            "Deterministic tie-breaker using alphanumeric IDs."
        ]),
        ("3. Weighted Road Graph", "Adjacency List + Dijkstra", "O((V + E) log V) Routing", [
            "11 regional transit hubs across Mumbai road network.",
            "Computes shortest distance from donor to beneficiary NGO.",
            "Rejects candidate allocations if locations are unreachable."
        ]),
        ("4. Greedy Matching Engine", "Multi-Criteria Optimization", "Atomic Allocation", [
            "Filters candidates by category compatibility & outstanding demand.",
            "Ranks feasible candidates: Priority -> Distance -> Demand fit.",
            "Executes atomic quantity decrements in SQLite transaction."
        ])
    ]

    for i, (title, struct_type, comp, bullets) in enumerate(cards_dsa):
        col = i % 2
        row = i // 2
        x = Inches(0.8 + col * 5.9)
        y = Inches(1.8 + row * 2.65)
        w = Inches(5.6)
        h = Inches(2.45)
        add_card(s4, x, y, w, h, f"{title} ({struct_type})")
        tb = s4.shapes.add_textbox(x + Inches(0.2), y + Inches(0.6), w - Inches(0.4), h - Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        
        # Complexity badge text
        p_c = tf.paragraphs[0]
        p_c.text = f"Complexity: {comp}"
        p_c.font.size = Pt(11)
        p_c.font.bold = True
        p_c.font.color.rgb = c_teal
        p_c.space_after = Pt(4)

        for b in bullets:
            p = tf.add_paragraph()
            p.text = "• " + b
            p.font.size = Pt(10)
            p.font.color.rgb = c_text_dark

    # ========================================================
    # SLIDE 5: MIN-HEAP & EXPIRY PRIORITIZATION
    # ========================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Min-Heap Priority Queue: Expiry Optimization")

    add_card(s5, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0), "Deterministic Min-Heap Mechanics")
    tb5_1 = s5.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(5.6), Inches(4.0))
    tf5_1 = tb5_1.text_frame
    tf5_1.word_wrap = True

    m_items = [
        ("Binary Tree Parent-Child Relation:", "For index i, left child = 2i + 1, right child = 2i + 2, parent = floor((i-1)/2)."),
        ("Custom Comparator:", "Compares expiry_epoch. The item with the smallest epoch (earliest expiry) sits at the root (index 0)."),
        ("Strict Tie-Breaking:", "When two donations share the exact same second of expiry, alphanumeric ID comparison ensures reproducible matching."),
        ("Lazy Invalidation:", "If a donation's status changes or quantity is depleted by manual edits, stale nodes are safely discarded on pop without expensive heap rebuilds."),
        ("Asymptotic Complexity:", "Push: O(log N) | Pop: O(log N) | Top: O(1) | Heapify from array: O(N).")
    ]
    for h, b in m_items:
        p = tf5_1.add_paragraph()
        p.text = h + " " + b
        p.font.size = Pt(11)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(8)

    add_card(s5, Inches(7.1), Inches(1.8), Inches(5.4), Inches(5.0), "Heap Tree Representation (Live Visualizer)")
    tb5_2 = s5.shapes.add_textbox(Inches(7.3), Inches(2.5), Inches(5.0), Inches(4.0))
    tf5_2 = tb5_2.text_frame
    tf5_2.word_wrap = True

    h_tree = [
        "             [Root: Index 0] D005 (1.8h Left)\n                     Kurla Banquet Hall (50 kg)",
        "                     /                     \\",
        "      [Index 1] D001 (2.5h)         [Index 2] D003 (3.5h)\n       SAKEC Canteen (25 kg)          Dadar Dairy Hub (30L)",
        "           /             \\               /             \\",
        "[Index 3] D006     [Index 4] D002   [Index 5] D008   [Index 6] D004\n (4.5h Left)        (6.0h Left)       (14.0h Left)     (36.0h Left)",
        "",
        "Key Property: The most time-critical surplus is guaranteed to be extracted first in O(1) peek time, preventing food spoilage!"
    ]
    for line in h_tree:
        p = tf5_2.add_paragraph()
        p.text = line
        p.font.size = Pt(9.5)
        p.font.name = "Consolas"
        p.font.color.rgb = c_dark_green

    # ========================================================
    # SLIDE 6: WEIGHTED GRAPH & DIJKSTRA'S ALGORITHM
    # ========================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Weighted Graph & Dijkstra's Shortest Path Routing")

    add_card(s6, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0), "Mumbai Road Network Graph Model")
    tb6_1 = s6.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(5.6), Inches(4.0))
    tf6_1 = tb6_1.text_frame
    tf6_1.word_wrap = True

    g_items = [
        "Vertices (11 Hubs): SAKEC Campus, Chembur East, Kurla, Ghatkopar, Sion, Dadar, Bandra, Andheri, Vashi, Thane, and Isolated Outlet.",
        "Adjacency List: Each vertex stores connected neighbors with non-negative road distances (km).",
        "Edge Weights (Examples):",
        "  • SAKEC Campus <-> Chembur East: 2.1 km",
        "  • SAKEC Campus <-> Kurla: 4.2 km",
        "  • Chembur East <-> Vashi: 11.5 km",
        "  • Kurla <-> Bandra: 6.8 km | Sion <-> Dadar: 4.1 km",
        "Unreachable Verification: 'Isolated Outlet' has zero connections. The algorithm correctly flags unreachable destinations without fabricating fake routes."
    ]
    for g in g_items:
        p = tf6_1.add_paragraph()
        p.text = g
        p.font.size = Pt(11)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(6)

    add_card(s6, Inches(7.1), Inches(1.8), Inches(5.4), Inches(5.0), "Dijkstra Execution & Relaxation Trace")
    tb6_2 = s6.shapes.add_textbox(Inches(7.3), Inches(2.5), Inches(5.0), Inches(4.0))
    tf6_2 = tb6_2.text_frame
    tf6_2.word_wrap = True

    d_steps = [
        "1. Initialization: Set dist[src] = 0, all other dist[v] = infinity. Push (0, src) to min-priority queue.",
        "2. Vertex Extraction: Pop vertex u with smallest known distance dist[u].",
        "3. Edge Relaxation: For each edge (u, v) with weight w:\n   if dist[u] + w < dist[v] then\n      dist[v] = dist[u] + w\n      parent[v] = u\n      push (dist[v], v) to priority queue.",
        "4. Trace Capture: Every relaxation step records old distance, new distance, and a vector snapshot sent to the frontend visualizer.",
        "5. Example Computed Result:\n   From SAKEC Campus -> Vashi:\n   Path: SAKEC -> Chembur East -> Vashi\n   Total Minimum Distance: 13.6 km"
    ]
    for s in d_steps:
        p = tf6_2.add_paragraph()
        p.text = s
        p.font.size = Pt(10.5)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(6)

    # ========================================================
    # SLIDE 7: SMART MATCHING & ALLOCATION POLICY
    # ========================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Expiry-First Greedy Allocation Policy")

    steps_alloc = [
        ("Step 1: Priority Pop", "Min-Heap extracts the earliest expiring valid donation (skipping expired/depleted batches)."),
        ("Step 2: Candidate Filter", "Scans active NGOs who accept the donation's category and have outstanding demand > 0."),
        ("Step 3: Dijkstra Reachability", "Runs Dijkstra routing. Any candidate location with distance = infinity is excluded."),
        ("Step 4: Candidate Ranking", "Sorts feasible candidates: (1) NGO Priority (HIGH > MED > LOW), (2) Shortest Distance, (3) Demand Fit."),
        ("Step 5: Quantity Calculation", "Allocates quantity Q = min(Donation Available, NGO Outstanding Demand)."),
        ("Step 6: Atomic SQLite Commit", "Executes transaction: updates donation status, reduces NGO demand, and logs audit record.")
    ]

    for i, (st, desc) in enumerate(steps_alloc):
        col = i % 3
        row = i // 3
        x = Inches(0.8 + col * 3.95)
        y = Inches(1.8 + row * 2.65)
        w = Inches(3.75)
        h = Inches(2.45)
        add_card(s7, x, y, w, h, st)
        tb = s7.shapes.add_textbox(x + Inches(0.2), y + Inches(0.7), w - Inches(0.4), h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(11)
        p.font.color.rgb = c_text_dark

    # ========================================================
    # SLIDE 8: APPLICATION SCREENS & FEATURES
    # ========================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Key Application Modules & User Interface")

    screens = [
        ("Overview Dashboard", "Live KPI cards, Recharts category donuts, expiry urgency bars, and recent redistribution feed."),
        ("Food Donations", "CRUD management, search, category filter, expiry sorting, and foreign-key allocation protection."),
        ("Recipient Orgs", "Partner NGO profiles, multi-category tags, demand fulfillment progress bars, and priority levels."),
        ("Smart Matching", "Flagship matching page with natural-language decision rationale and atomic confirmation modal."),
        ("Route Planner", "Interactive SVG road network graph with edge distance labels and highlighted shortest route."),
        ("Allocation History", "Complete transaction audit log with direct CSV export and modal inspection of route paths."),
        ("Algorithm Visualizer", "Interactive educational page: Min-Heap tree, Dijkstra step-by-step scrubber, and Hash buckets."),
        ("Settings / About", "SAKEC AIDS academic credits, C++ runtime diagnostics, and one-click synthetic data reset.")
    ]

    for i, (title, desc) in enumerate(screens):
        col = i % 4
        row = i // 4
        x = Inches(0.8 + col * 2.95)
        y = Inches(1.8 + row * 2.65)
        w = Inches(2.75)
        h = Inches(2.45)
        add_card(s8, x, y, w, h, title)
        tb = s8.shapes.add_textbox(x + Inches(0.15), y + Inches(0.65), w - Inches(0.3), h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(10)
        p.font.color.rgb = c_text_dark

    # ========================================================
    # SLIDE 9: TESTING & VERIFICATION (18/18 PASSED)
    # ========================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Automated Testing & Verification: 18/18 Scenarios Passed")

    # Table of tests
    table_shape = s9.shapes.add_table(10, 4, Inches(0.8), Inches(1.8), Inches(11.7), Inches(5.0))
    table = table_shape.table
    table.columns[0].width = Inches(0.8)
    table.columns[1].width = Inches(4.2)
    table.columns[2].width = Inches(5.5)
    table.columns[3].width = Inches(1.2)

    headers = ["#", "Test Scenario", "Expected / Actual Verification", "Status"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = c_dark_green
        p = cell.text_frame.paragraphs[0]
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = c_white

    test_rows = [
        ("1", "Donation Registration & Retrieval", "Inserted & retrieved by ID 'T001' with exact fields matched", "PASS"),
        ("2", "Duplicate ID Rejection", "SQLite primary key constraint blocks duplicate 'T001' insertion", "PASS"),
        ("3", "Negative Quantity Blocking", "Validation constraint throws exception on quantity = -15.0", "PASS"),
        ("4", "Earliest Expiry Prioritization", "Min-Heap correctly pops 2000s before 5000s and 10000s", "PASS"),
        ("5", "Expired Food Exclusion", "Donations with expiry < current time excluded from new matching", "PASS"),
        ("6", "Incompatible Category Rejection", "Rejects matching Packaged Goods to recipient accepting Cooked Meals", "PASS"),
        ("7", "Dijkstra Shortest Path", "Calculated triangle route A->B->C = 5.0 km vs direct 9.0 km", "PASS"),
        ("8", "Unreachable Node Detection", "Reports reachable=false, distance=-1.0 for disconnected nodes", "PASS"),
        ("9", "Database Rollback on Failure", "Full restoration of records after transaction abort & rollback", "PASS"),
    ]

    for i, row in enumerate(test_rows):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(9.5)
            if j == 3:
                p.font.bold = True
                p.font.color.rgb = c_dark_green

    # ========================================================
    # SLIDE 10: COMPLEXITY ANALYSIS MATRIX
    # ========================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Data Structure & Algorithm Complexity Analysis")

    t10_shape = s10.shapes.add_table(5, 5, Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.8))
    t10 = t10_shape.table
    t10.columns[0].width = Inches(2.8)
    t10.columns[1].width = Inches(2.4)
    t10.columns[2].width = Inches(2.0)
    t10.columns[3].width = Inches(2.2)
    t10.columns[4].width = Inches(2.3)

    c_headers = ["Algorithm / Operation", "C++ Implementation", "Average Time", "Worst-Case Time", "Space Complexity"]
    for j, h in enumerate(c_headers):
        cell = t10.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = c_dark_green
        p = cell.text_frame.paragraphs[0]
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = c_white

    c_data = [
        ("Entity Search & Cache", "std::unordered_map", "O(1)", "O(N) (Hash Collisions)", "O(N)"),
        ("Expiry Prioritization", "ExpiryMinHeap (Binary Tree)", "O(log N)", "O(log N)", "O(N) Contiguous"),
        ("Urban Route Planning", "Dijkstra + Priority Queue", "O((V + E) log V)", "O((V + E) log V)", "O(V + E) Adjacency"),
        ("Candidate Ranking", "std::sort (Introsort)", "O(K log K)", "O(K log K)", "O(log K) Stack")
    ]

    for i, row in enumerate(c_data):
        for j, val in enumerate(row):
            cell = t10.cell(i + 1, j)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(10.5)
            if j in (2, 3, 4):
                p.font.name = "Consolas"
                p.font.bold = True
                p.font.color.rgb = c_teal

    # ========================================================
    # SLIDE 11: CONCLUSION & FUTURE SCOPE
    # ========================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Conclusion, Learnings & Future Enhancements")

    add_card(s11, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), "Academic & Technical Learnings")
    tb11_1 = s11.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(5.2), Inches(4.0))
    tf11_1 = tb11_1.text_frame
    tf11_1.word_wrap = True
    l_items = [
        "Bridging theoretical DSA concepts with high-impact sustainability engineering.",
        "Hands-on C++17 memory management, binary heap implementation, and graph traversals.",
        "Building asynchronous REST APIs connecting native compiled C++ with modern React.",
        "ACID database transaction integrity preventing partial or corrupted food allocations.",
        "100% automated test verification ensuring system robustness across 18 edge cases."
    ]
    for it in l_items:
        p = tf11_1.add_paragraph()
        p.text = "✔ " + it
        p.font.size = Pt(11)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(10)

    add_card(s11, Inches(6.8), Inches(1.8), Inches(5.6), Inches(5.0), "Future Scope & Real-World Scaling")
    tb11_2 = s11.shapes.add_textbox(Inches(7.0), Inches(2.5), Inches(5.2), Inches(4.0))
    tf11_2 = tb11_2.text_frame
    tf11_2.word_wrap = True
    f_items = [
        "Live GPS & Traffic Integration: Dynamic road weights using OpenStreetMap / TomTom API.",
        "Vehicle Routing Problem (VRP): Multi-stop pickup routes for volunteer rescue vans.",
        "Mobile App for Donors: React Native app with barcode scanning for fast batch check-in.",
        "Predictive Demand Forecasting: Machine learning models predicting food surplus by day/event.",
        "Cold-Chain IoT Sensors: Real-time temperature monitoring for high-risk dairy & meat batches."
    ]
    for it in f_items:
        p = tf11_2.add_paragraph()
        p.text = "➔ " + it
        p.font.size = Pt(11)
        p.font.color.rgb = c_text_dark
        p.space_after = Pt(10)

    # Save presentation
    os.makedirs("docs", exist_ok=True)
    ppt_path = os.path.join("docs", "Food_Rescue_DSA_Presentation.pptx")
    prs.save(ppt_path)
    print(f"Presentation successfully generated at: {ppt_path}")

if __name__ == "__main__":
    create_presentation()
